import type { Context, Next } from "hono";
import type { FacilitatorConfig, PaymentConfig, NetworkType } from "./types";
import { paymentMiddleware } from "x402-hono";
import { createFacilitatorConfig } from "@coinbase/x402";

const PRICE_PER_GB = 0.1;
const MONTHS = 12;

export const createDynamicPaymentMiddleware = (
  receivingWallet: `0x`,
  initialBaseConfig: PaymentConfig,
  initialFacilitatorConfig: FacilitatorConfig | null
) => {
  return async (c: Context, next: Next) => {
    let baseConfig = { ...initialBaseConfig };
    let facilitatorConfig = initialFacilitatorConfig;

    if (!facilitatorConfig) {
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
          network: "base" as NetworkType,
          config: {
            description: "Pay2Pin",
          },
        },
        "/v1/pin/private": {
          price: `$${priceToUse.toFixed(4)}`,
          network: "base" as NetworkType,
          config: {
            description: "Pay2Pin",
          },
        },
      };
    } else {
      baseConfig = {
        "/v1/retrieve/private/*": {
          price: "$0.0001",
          network: "base" as NetworkType,
          config: {
            description: "Pay2Read",
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
