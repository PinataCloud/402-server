export type Bindings = {
  PINATA_JWT: string;
  PINATA_GATEWAY_URL: string;
  PINATA_GATEWAY_KEY: string;
  CDP_API_KEY_ID: string;
  CDP_API_KEY_SECRET: string;
  NETWORK?: string; // Optional with fallback to "base"
};

export type NetworkType = "base" | "base-sepolia";
