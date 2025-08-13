import type { Context, Next } from "hono";
import type { FacilitatorConfig, PaymentConfig, NetworkType } from "./types";
import { paymentMiddleware } from "x402-hono";
import { createFacilitatorConfig } from "@coinbase/x402";

const PRICE_PER_GB = 0.1;
const MONTHS = 12;

export const createDynamicPaymentMiddleware = (
  receivingWallet: `0x`,
  initialBaseConfig: PaymentConfig,
  initialFacilitatorConfig: FacilitatorConfig | null,
  network: NetworkType = "base"
) => {
  return async (c: Context, next: Next) => {
    let baseConfig = { ...initialBaseConfig };
    let facilitatorConfig = initialFacilitatorConfig;

    if (!facilitatorConfig) {
      // Validate required environment variables
      if (!c.env.CDP_API_KEY_ID || !c.env.CDP_API_KEY_SECRET) {
        throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables are required');
      }
      
      //  Custom config for mainnet to ensure we can get envs from context
      facilitatorConfig = createFacilitatorConfig(c.env.CDP_API_KEY_ID, c.env.CDP_API_KEY_SECRET)
      console.log({ facilitatorConfig })
    }
    if (c.req.method === "POST") {
      const { fileSize } = await c.req.json();

      const fileSizeInGB = fileSize / (1024 * 1024 * 1024);
      const price = fileSizeInGB * PRICE_PER_GB * MONTHS;
      const priceToUse = price >= 0.0001 ? price : 0.0001;
      baseConfig = {
        "/v1/pin/public": {
          price: `$${priceToUse.toFixed(4)}`,
          network: network,
          config: {
            description: "Pay to pin a public file to Pinata",
            inputSchema: {
              bodyParams: {
                fileSize: {
                  type: "number",
                  description: "Size of the file to upload in bytes",
                  required: true
                }
              }
            },
            outputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Signed URL for uploading the file"
                }
              }
            }
          },
        },
        "/v1/pin/private": {
          price: `$${priceToUse.toFixed(4)}`,
          network: network,
          config: {
            description: "Pay to pin a private file to Pinata",
            inputSchema: {
              bodyParams: {
                fileSize: {
                  type: "number",
                  description: "Size of the file to upload in bytes",
                  required: true
                }
              }
            },
            outputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Signed URL for uploading the file"
                }
              }
            }
          },
        },
      };
    } else {
      baseConfig = {
        "/v1/retrieve/private/*": {
          price: "$0.0001",
          network: network,
          config: {
            description: "Pay to retrieve a private file from Pinata by CID",
            inputSchema: {
              pathParams: {
                cid: {
                  type: "string",
                  description: "Content Identifier (CID) of the file to retrieve",
                  required: true
                }
              }
            },
            outputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Temporary access URL for the private file"
                }
              }
            }
          },
        },
      }
    }

    const dynamicPaymentMiddleware = paymentMiddleware(
      receivingWallet,
      baseConfig as any,
      facilitatorConfig
    );

    return dynamicPaymentMiddleware(c, next);
  };
};
