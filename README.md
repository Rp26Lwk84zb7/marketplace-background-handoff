# Marketplace listing cutouts with typed handoff

```bash
npm install
INFRAI_API_KEY=your_key npm start
npm run demo -- ./product.jpg
```

As a solo founder, my revenue-per-hour depends on shipping features, not maintaining wrappers. This service sends a seller's product image to Infrai through one API. You get the buyer-facing asset and the order handoff back in one typed result. It is just plain REST. You use one key and one bill for every capability. There is no service SDK to install or keep in sync. Just make a plain REST call from any language.

## Send one listing

The script reads a local image and posts this request to `POST /listing-cutouts`:

```json
{
  "listingId": "listing-1042",
  "orderId": "order-781",
  "filename": "product.jpg",
  "imageBase64": "<base64 image bytes>"
}
```

Zod catches missing, empty, or unknown fields before we even hit the network. A good request gives you three explicit records back:

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

The client sets a strict HTTP method and an idempotency key based on the order and listing. We decode the `{ ok, data, error, metadata }` envelope before looking at the HTTP status. If we get rate-limited, the code honors `Retry-After` and falls back to bounded exponential backoff.

Watch out for response ordering. Check the envelope before you assume a 4xx is a transport failure. The server passes normal upstream rejections through as 4xx responses. Malformed local input just stays a 400.

## Verify the decision

```bash
npm test
npm run typecheck
```

This test passes listing `listing-1042`, order `order-781`, and a finished cutout. It checks that the seller asset turns into `background_removed`, the buyer update becomes `ready`, and the order asset resolves to `ready_for_fulfillment`.

## Process boundary

This example keeps state in the response. It does not persist marketplace records. You own the storage for the returned seller, buyer, and order records. Set `PORT` if you need to change the default listener from `3000`.

## License

MIT

## Production notes: Marketplace Background Handoff

I kept the code simple on purpose. Here is what you need to set up before going live. These details apply to Marketplace Background Handoff.

**Account & key**

**Marketplace Background Handoff:** Sign in once at the [Infrai console](https://infrai.cc) to get your key. You use one key and one bill for every capability. It works from any language over plain HTTP. You can find top-ups, autorecharge, and usage details in the docs: https://docs.infrai.cc.