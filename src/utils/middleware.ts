import type { Context, Next } from "hono";
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import type { NetworkType, Bindings } from "./types";

const PRICE_PER_GB = 0.1;
const MONTHS = 12;

function createServer(
  isMainnet: boolean,
  cdpApiKeyId?: string,
  cdpApiKeySecret?: string,
): x402ResourceServer {
  const facilitatorConfig = isMainnet
    ? createFacilitatorConfig(cdpApiKeyId, cdpApiKeySecret)
    : { url: "https://x402.org/facilitator" };

  const facilitatorClient = new HTTPFacilitatorClient(facilitatorConfig);
  const server = new x402ResourceServer(facilitatorClient);
  registerExactEvmScheme(server);
  return server;
}

export const createDynamicPaymentMiddleware = (
  receivingWallet: `0x${string}`,
  network: NetworkType = "base",
) => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const fileSizeParam = c.req.query("fileSize");
    const fileSize = fileSizeParam ? parseInt(fileSizeParam, 10) : 1024;

    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);
    const price = fileSizeInGB * PRICE_PER_GB * MONTHS;
    // CDP facilitator enforces a minimum of $0.001 (1000 microUSDC)
    const priceToUse = price >= 0.001 ? price : 0.001;

    // Use CAIP-2 network identifiers for x402 v2
    const networkId =
      network === "base-sepolia" ? "eip155:84532" : "eip155:8453";
    const isMainnet = network === "base";

    const server = createServer(
      isMainnet,
      c.env.CDP_API_KEY_ID,
      c.env.CDP_API_KEY_SECRET,
    );

    // Route keys must include HTTP method prefix per x402 docs
    const routes: Record<string, any> = {
      "POST /v1/pin/public": {
        accepts: [
          {
            scheme: "exact",
            price: `$${priceToUse.toFixed(4)}`,
            network: networkId,
            payTo: receivingWallet,
          },
        ],
        description: "Pay to pin a public file to Pinata",
        mimeType: "application/json",
      },
      "POST /v1/pin/private": {
        accepts: [
          {
            scheme: "exact",
            price: `$${priceToUse.toFixed(4)}`,
            network: networkId,
            payTo: receivingWallet,
          },
        ],
        description: "Pay to pin a private file to Pinata",
        mimeType: "application/json",
      },
      "GET /v1/retrieve/private/*": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: networkId,
            payTo: receivingWallet,
          },
        ],
        description: "Pay to retrieve a private file from Pinata by CID",
        mimeType: "application/json",
      },
    };

    return paymentMiddleware(routes, server)(c, next);
  };
};
