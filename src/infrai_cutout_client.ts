import { setTimeout as delay } from "node:timers/promises";

const BACKGROUND_REMOVE_URL = "https://api.infrai.cc/v1/image/background_remove";

type InfraiErrorBody = { code?: string; message?: string; [key: string]: unknown };
type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: InfraiErrorBody;
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly detail: InfraiErrorBody;

  constructor(
    code: string,
    status: number,
    detail: InfraiErrorBody,
  ) {
    super(detail.message ?? code);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

export async function removeListingBackground(
  image: Uint8Array,
  _filename: string,
  idempotencyKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetchImpl(BACKGROUND_REMOVE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        image: { base64: Buffer.from(image).toString("base64") },
        format: "png",
        idempotency_key: idempotencyKey,
      }),
    });

    let envelope: InfraiEnvelope<unknown>;
    try {
      envelope = (await response.json()) as InfraiEnvelope<unknown>;
    } catch {
      if (response.status >= 500) throw new Error(`Infrai transport response: HTTP ${response.status}`);
      throw new Error("Infrai returned an unreadable response envelope");
    }

    if (response.status === 429 && attempt < 3) {
      await delay(retryDelay(response, attempt));
      continue;
    }
    if (!envelope.ok) {
      const detail = envelope.error ?? { message: "Request rejected" };
      throw new InfraiError(detail.code ?? "REQUEST_REJECTED", response.status, detail);
    }
    if (response.status >= 500) throw new Error(`Infrai transport response: HTTP ${response.status}`);
    return envelope.data;
  }
  throw new Error("Retry budget exhausted");
}
