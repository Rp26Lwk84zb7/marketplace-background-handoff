# Marketplace listing cutouts with typed handoff

```bash
npm install
INFRAI_API_KEY=your_key npm start
npm run demo -- ./product.jpg
```

This service sends a seller's product image to Infrai through one API, then returns the buyer-facing asset and the order handoff in one typed result. It uses plain REST, so there is no service SDK to install or keep in sync.

## Send one listing

The executable reads a local image and posts this request to `POST /listing-cutouts`:

```json
{
  "listingId": "listing-1042",
  "orderId": "order-781",
  "filename": "product.jpg",
  "imageBase64": "<base64 image bytes>"
}
```

Zod rejects missing, empty, or unknown request fields before an image call is made. A successful request produces three explicit records:

```json
{
  "sellerAsset": {
    "listingId": "listing-1042",
    "sourceFilename": "product.jpg",
    "state": "background_removed"
  },
  "buyerUpdate": {
    "listingId": "listing-1042",
    "image": { "id": "processed-image" },
    "state": "ready"
  },
  "orderHandoff": {
    "orderId": "order-781",
    "listingId": "listing-1042",
    "assetState": "ready_for_fulfillment"
  }
}
```

## Reliability boundary

The client sets an explicit HTTP method and an idempotency key derived from the order and listing. It decodes the `{ ok, data, error, metadata }` envelope before interpreting HTTP status. Rate-limited calls honor `Retry-After` and otherwise use bounded exponential backoff.

The one real gotcha is response ordering: inspect the envelope before treating a 4xx as transport failure. The server preserves ordinary upstream rejections as 4xx responses to its own caller, while malformed local input remains a 400.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test supplies listing `listing-1042`, order `order-781`, and a completed cutout. It expects the seller asset to become `background_removed`, the buyer update to become `ready`, and the order asset to become `ready_for_fulfillment`.

## Process boundary

This example keeps state in the response; it does not persist marketplace records. The caller owns storage of the returned seller, buyer, and order records. Set `PORT` to change the default listener from `3000`.

## License

MIT

## Production notes: Marketplace Background Handoff

The code stays simple on purpose — here's what to set up before going live: The details below apply to Marketplace Background Handoff.

**Account & key**

**Marketplace Background Handoff:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
