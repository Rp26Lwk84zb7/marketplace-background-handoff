import { createServer } from "node:http";
import { z } from "zod";
import { buildMarketplaceHandoff } from "./handoff_policy.js";
import { InfraiError, removeListingBackground } from "./infrai_cutout_client.js";

const requestSchema = z.object({
  listingId: z.string().min(1),
  orderId: z.string().min(1),
  filename: z.string().min(1),
  imageBase64: z.string().min(1),
}).strict();

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.method !== "POST" || request.url !== "/listing-cutouts") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const input = requestSchema.parse(await readJson(request));
    const processedImage = await removeListingBackground(
      Buffer.from(input.imageBase64, "base64"),
      input.filename,
      `${input.orderId}:${input.listingId}`,
    );
    const handoff = buildMarketplaceHandoff({
      listingId: input.listingId,
      orderId: input.orderId,
      sourceFilename: input.filename,
      processedImage,
    });
    response.writeHead(201).end(JSON.stringify(handoff));
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid request", issues: error.issues }));
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      response.writeHead(status).end(JSON.stringify({ error: error.code, detail: error.detail }));
      return;
    }
    response.writeHead(502).end(JSON.stringify({ error: "Image processing failed" }));
  }
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`listing cutout service listening on http://localhost:${port}`));
}
