import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketplaceHandoff } from "../src/handoff_policy.js";

test("a completed cutout advances seller, buyer, and order states", () => {
  const image = { id: "asset-cutout-17", url: "https://cdn.example.test/cutout.png" };
  const result = buildMarketplaceHandoff({
    listingId: "listing-1042",
    orderId: "order-781",
    sourceFilename: "ceramic-mug.jpg",
    processedImage: image,
  });

  assert.deepEqual(result, {
    sellerAsset: {
      listingId: "listing-1042",
      sourceFilename: "ceramic-mug.jpg",
      state: "background_removed",
    },
    buyerUpdate: { listingId: "listing-1042", image, state: "ready" },
    orderHandoff: {
      orderId: "order-781",
      listingId: "listing-1042",
      assetState: "ready_for_fulfillment",
    },
  });
});
