# 402 Server - Paid Pinata IPFS Storage

A Cloudflare Workers API that enables pay-per-use IPFS file storage via Pinata using the x402 v2 protocol.

## Features

- **x402 v2 Payment Protocol**: Accept crypto payments on Base (mainnet) and Base Sepolia (testnet)
- **Dynamic Pricing**: Price scales with file size (0.1 USDC per GB for 12 months)
- **Public & Private Storage**: Upload files with different visibility levels
- **Pay-to-Retrieve**: Charge for accessing private files

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.dev.vars.example` to `.dev.vars` and fill in your credentials:

```bash
cp .dev.vars.example .dev.vars
```

Required variables:
- `CDP_API_KEY_ID` - Your Coinbase Developer Platform API Key ID (for mainnet)
- `CDP_API_KEY_SECRET` - Your CDP API Key Secret (for mainnet)
- `PINATA_JWT` - Your Pinata API JWT token
- `PINATA_GATEWAY_KEY` - Your Pinata gateway access key

### 3. Configure Network

Set the network in `wrangler.jsonc`:
- `"base"` - For mainnet (requires CDP credentials)
- `"base-sepolia"` - For testnet

## Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`

## Testing

Run tests:
```bash
npm test                  # All tests
npm run test:sepolia      # Base Sepolia testnet
npm run test:mainnet      # Base mainnet
```

For mainnet tests, set:
```bash
export TEST_API_URL=https://your-worker-url.workers.dev
export TEST_PRIVATE_KEY=0x...  # Test wallet with USDC and ETH
```

## Deployment

```bash
npm run deploy           # Deploy to default environment
npm run deploy:dev       # Deploy to dev environment
npm run deploy:prod      # Deploy to prod environment
```

Make sure to set secrets in Cloudflare Workers dashboard:
- `CDP_API_KEY_ID`
- `CDP_API_KEY_SECRET`
- `PINATA_JWT`
- `PINATA_GATEWAY_KEY`

## API Endpoints

### POST /v1/pin/public
Upload a public file to Pinata. Returns a signed URL for upload.

**Payment**: Dynamic based on file size (query param `fileSize`)

### POST /v1/pin/private
Upload a private file to Pinata. Returns a signed URL for upload.

**Payment**: Dynamic based on file size (query param `fileSize`)

### GET /v1/retrieve/private/:cid
Retrieve a private file by CID. Returns a temporary access URL.

**Payment**: Fixed 0.0001 USDC

## x402 v2 Migration Notes

This server uses x402 v2 protocol with:
- **Facilitators**: CDP mainnet facilitator for production, x402.org for testnet
- **Network IDs**: CAIP-2 format (`eip155:8453` for Base, `eip155:84532` for Base Sepolia)
- **Authentication**: Automatic via `@coinbase/x402` package when CDP env vars are set

For more info, see [x402 v2 Migration Guide](https://docs.cdp.coinbase.com/x402/docs/migration-guide)
