import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { wrapFetchWithPayment } from 'x402-fetch';
import { config } from 'dotenv';

config({ path: '.dev.vars' });

const account = privateKeyToAccount(process.env.TEST_PRIVATE_KEY);
console.log('Using wallet:', account.address);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});

const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient, BigInt(10000000));

console.log('\n=== Testing payment to mainnet ===\n');

try {
  const response = await fetchWithPayment('https://402-server.pinata-marketing-enterprise.workers.dev/v1/pin/public', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileSize: 1024 })
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  const data = await response.json();
  console.log('Response body:', JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
