import type { Context, Next } from "hono";
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import type { NetworkType, Bindings } from "./types";

const PRICE_PER_GB = 0.1;
const MONTHS = 12;

// Cache facilitator clients and servers per network to avoid recreating on each request
const facilitatorCache = new Map<string, { facilitatorClient: any; server: any }>();

// Create facilitator client and server
function createFacilitatorAndServer(
  isMainnet: boolean,
  network: string,
  cdpApiKeyId?: string,
  cdpApiKeySecret?: string
) {
  // Check cache first - include key ID in cache to handle credential changes
  const cacheKey = `${isMainnet ? 'mainnet' : 'testnet'}:${network}:${cdpApiKeyId || 'none'}`;
  if (facilitatorCache.has(cacheKey)) {
    return facilitatorCache.get(cacheKey)!;
  }

  // Create facilitator client
  // For mainnet, use CDP facilitator with explicit credentials from Workers env
  // For testnet, use the public x402.org facilitator
  const facilitatorClient = isMainnet
    ? (() => {
        console.log('Creating CDP facilitator with credentials:', {
          hasKeyId: !!cdpApiKeyId,
          hasKeySecret: !!cdpApiKeySecret,
          keyIdPrefix: cdpApiKeyId?.substring(0, 8)
        });
        return new HTTPFacilitatorClient(createFacilitatorConfig(cdpApiKeyId, cdpApiKeySecret));
      })()
    : new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" });

  const server = new x402ResourceServer(facilitatorClient);

  // Register EVM scheme for the specific network (as per CDP docs)
  server.register(network, new ExactEvmScheme());

  // Cache for reuse
  const result = { facilitatorClient, server };
  facilitatorCache.set(cacheKey, result);

  return result;
}

export const createDynamicPaymentMiddleware = (
  receivingWallet: `0x${string}`,
  network: NetworkType = "base"
) => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    // Get fileSize from query parameter for dynamic pricing
    const fileSizeParam = c.req.query('fileSize');
    const fileSize = fileSizeParam ? parseInt(fileSizeParam, 10) : 1024;

    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);
    const price = fileSizeInGB * PRICE_PER_GB * MONTHS;
    const priceToUse = price >= 0.0001 ? price : 0.0001;

    // Map network to CAIP-2 format
    const networkId = network === "base-sepolia"
      ? "eip155:84532"  // Base Sepolia
      : "eip155:8453";   // Base Mainnet

    const isMainnet = network === "base";

    // Create facilitator and server (cached per network)
    // Mainnet uses CDP facilitator with explicit credentials from Workers env
    // Testnet uses public x402.org facilitator
    const { server } = createFacilitatorAndServer(
      isMainnet,
      networkId,
      c.env.CDP_API_KEY_ID,
      c.env.CDP_API_KEY_SECRET
    );

    console.log({
      network: networkId,
      facilitator: isMainnet ? "CDP (mainnet)" : "x402.org (testnet)",
      price: `$${priceToUse.toFixed(4)}`
    });

    // Define route configurations using x402 v2 format
    const routes: Record<string, any> = {};

    if (c.req.method === "POST") {
      routes["/v1/pin/public"] = {
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
        extensions: {
          bazaar: {
            discoverable: true,
            category: "storage",
            tags: ["ipfs", "pinata", "public"],
          },
        },
      };

      routes["/v1/pin/private"] = {
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
        extensions: {
          bazaar: {
            discoverable: true,
            category: "storage",
            tags: ["ipfs", "pinata", "private"],
          },
        },
      };
    } else {
      routes["/v1/retrieve/private/*"] = {
        accepts: [
          {
            scheme: "exact",
            price: "$0.0001",
            network: networkId,
            payTo: receivingWallet,
          },
        ],
        description: "Pay to retrieve a private file from Pinata by CID",
        mimeType: "application/json",
        extensions: {
          bazaar: {
            discoverable: true,
            category: "storage",
            tags: ["ipfs", "pinata", "retrieve"],
          },
        },
      };
    }

    // Apply x402 v2 payment middleware
    const middleware = paymentMiddleware(routes, server);

    try {
      return await middleware(c, next);
    } catch (error) {
      console.error('Payment middleware error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        facilitator: isMainnet ? "CDP (mainnet)" : "x402.org (testnet)",
        network: networkId,
        errorType: error?.constructor?.name,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      throw error;
    }
  };
};
