# 402 Payment Routes Testing

## Setup

1. Update `.env.test` with your credentials:
   - `TEST_PRIVATE_KEY`: Your test wallet private key with base-sepolia ETH
   - `TEST_RECEIVING_WALLET`: The wallet address that will receive payments
   - `PINATA_JWT`: Your Pinata JWT token
   - `PINATA_GATEWAY_URL`: Your Pinata gateway URL
   - `PINATA_GATEWAY_KEY`: Your Pinata gateway key
   - `CDP_API_KEY_ID`: Your Coinbase Developer Platform API key ID
   - `CDP_API_KEY_SECRET`: Your Coinbase Developer Platform API key secret

2. Ensure your test wallet has base-sepolia ETH for gas fees

3. Update `src/index.ts` to use base-sepolia for testing:
   ```typescript
   // For testing with base-sepolia, pass the facilitator config:
   const facilitatorConfig = createFacilitatorConfig(
     process.env.CDP_API_KEY_ID,
     process.env.CDP_API_KEY_SECRET
   );
   
   app.use(
     createDynamicPaymentMiddleware(
       "0xYourReceivingWallet" as `0x`,
       {},
       facilitatorConfig,
       "base-sepolia" // Add network parameter
     )
   );
   ```

## Running Tests

### Start the development server with test configuration:
```bash
npm run dev:test
```
This runs the server with `wrangler.test.jsonc` configuration using base-sepolia network.

### In another terminal, run tests:
```bash
npm test
```

### Other test commands:
```bash
npm run test:ui    # Run tests with UI
npm run test:watch  # Run tests in watch mode  
npm run test:run    # Run tests once and exit
```

## Test Coverage

The tests cover:

### Pin Routes (`/v1/pin/public` and `/v1/pin/private`)
- ✅ Creating signed URLs with valid payment
- ✅ Rejecting requests without payment header (402 status)
- ✅ Validating required parameters (fileSize)
- ✅ Price calculation based on file size
- ✅ Proper metadata configuration

### Retrieve Routes (`/v1/retrieve/private/:cid`)
- ✅ Retrieving files with valid payment and CID
- ✅ Rejecting requests without payment (402 status)
- ✅ Handling missing or invalid CIDs
- ✅ Test endpoint without payment requirement

### Payment Validation
- ✅ Correct price calculation (0.1 per GB * 12 months)
- ✅ Minimum price enforcement (0.0001)
- ✅ Base-sepolia network configuration
- ✅ Payment header validation

### Metadata Validation
- ✅ Input schema validation
- ✅ Output schema validation
- ✅ Route descriptions

## Network Configuration

All tests are configured to use **base-sepolia** network for testing purposes. The production deployment should be configured to use the mainnet "base" network.

## Troubleshooting

1. **Insufficient funds error**: Ensure your test wallet has enough base-sepolia ETH
2. **Network errors**: Check that you're connected to the correct RPC endpoint
3. **Authentication errors**: Verify your CDP API credentials are correct
4. **Pinata errors**: Check your Pinata JWT and gateway configuration