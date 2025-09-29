import type { createFacilitatorConfig } from "@coinbase/x402";

export type Bindings = {
  PINATA_JWT: string;
  PINATA_GATEWAY_URL: string;
  PINATA_GATEWAY_KEY: string;
  CDP_API_KEY_ID: string;
  CDP_API_KEY_SECRET: string;
  NETWORK?: string; // Optional with fallback to "base"
};

export type NetworkType = "base" | "base-sepolia";

export interface RouteConfig {
  price: string;
  network: string;
  config: {
    discoverable: boolean;
    description: string;
    inputSchema?: {
      queryParams?: Record<string, any>;
      bodyParams?: Record<string, any>;
      pathParams?: Record<string, any>;
    };
    outputSchema?: {
      type: string;
      properties?: Record<string, any>;
    };
  };
}

export interface PaymentConfig {
  [route: string]: RouteConfig;
}

export type FacilitatorConfig = ReturnType<typeof createFacilitatorConfig>;
