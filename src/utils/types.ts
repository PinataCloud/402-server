import type { Context } from "hono";

export type Bindings = {
  PINATA_JWT: string;
  PINATA_GATEWAY_URL: string;
  PINATA_GATEWAY_KEY: string;
  CDP_API_KEY_ID: string;
  CDP_API_KEY_SECRET: string;
  NETWORK?: string; // Optional with fallback to "base"
};

export type NetworkType = "base" | "base-sepolia";

/**
 * Extract the payer's wallet address from the x402 payment header.
 * Works with both v2 (PAYMENT-SIGNATURE) and v1 (X-PAYMENT) headers.
 * The payload contains: { payload: { authorization: { from: "0x..." } } }
 */
export function getPayerAddress(c: Context): string | null {
  const header = c.req.header("payment-signature") || c.req.header("x-payment");
  if (!header) return null;
  try {
    const parsed = JSON.parse(atob(header));
    return parsed?.payload?.authorization?.from ?? null;
  } catch {
    return null;
  }
}
