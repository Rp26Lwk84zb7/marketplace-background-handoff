export type ListingCutout = {
  listingId: string;
  orderId: string;
  sourceFilename: string;
  processedImage: unknown;
};

export type MarketplaceHandoff = {
  sellerAsset: {
    listingId: string;
    sourceFilename: string;
    state: "background_removed";
  };
  buyerUpdate: {
    listingId: string;
    image: unknown;
    state: "ready";
  };
  orderHandoff: {
    orderId: string;
    listingId: string;
    assetState: "ready_for_fulfillment";
  };
};

export function buildMarketplaceHandoff(input: ListingCutout): MarketplaceHandoff {
  return {
    sellerAsset: {
      listingId: input.listingId,
      sourceFilename: input.sourceFilename,
      state: "background_removed",
    },
    buyerUpdate: {
      listingId: input.listingId,
      image: input.processedImage,
      state: "ready",
    },
    orderHandoff: {
      orderId: input.orderId,
      listingId: input.listingId,
      assetState: "ready_for_fulfillment",
    },
  };
}
