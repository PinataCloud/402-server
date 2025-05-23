import type { createFacilitatorConfig } from "@coinbase/x402";

export type Bindings = {
  PINATA_JWT: string;
  PINATA_GATEWAY_URL: string;
  PINATA_GATEWAY_KEY: string;
};

export type NetworkType = "base" | "base-sepolia";

export interface RouteConfig {
  price: string;
  network: string;
  config: {
    description: string;
    [key: string]: string;
  };
}

export interface PaymentConfig {
  [route: string]: RouteConfig;
}

export type FacilitatorConfig = ReturnType<typeof createFacilitatorConfig>;
