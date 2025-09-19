import { describe, it, expect, beforeAll } from 'vitest';
import { createWalletClient, http, type PrivateKeyAccount } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { wrapFetchWithPayment } from 'x402-fetch';
import { readFileSync } from 'fs';
import path from 'path';

interface SignedUrlResponse {
  url: string;
}

interface PinataUploadResponse {
  data: {
    cid: string;
    size: number;
    [key: string]: unknown;
  };
}

interface PaymentRequiredResponse {
  accepts: Array<{
    network: string;
    payTo: string;
    description: string;
    [key: string]: unknown;
  }>;
}

interface PrivateRetrieveResponse {
  url: string;
}

const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:8787';
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;
const PINATA_GATEWAY_KEY = process.env.PINATA_GATEWAY_KEY;

describe('End-to-End File Upload Tests', () => {
  let account: PrivateKeyAccount;
  let walletClient: any;
  let fetchWithPayment: typeof fetch;

  beforeAll(() => {
    if (!TEST_PRIVATE_KEY) {
      throw new Error('TEST_PRIVATE_KEY environment variable is required');
    }
    
    account = privateKeyToAccount(TEST_PRIVATE_KEY as `0x${string}`);
    
    walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });
    
    // Set max payment to 10 USDC for testing
    fetchWithPayment = wrapFetchWithPayment(fetch, walletClient, BigInt(10000000));
  });

  it('should upload pinnie.png to public Pinata and get CID', async () => {
    // Load the test image file
    const imagePath = path.join(__dirname, 'pinnie.png');
    const imageBuffer = readFileSync(imagePath);
    const testFile = new File([imageBuffer], 'pinnie.png', { type: 'image/png' });
    
    console.log('Pinnie.png file size:', testFile.size, 'bytes');

    // Step 1: Get signed URL with payment
    const signedUrlResponse = await fetchWithPayment(`${TEST_API_URL}/v1/pin/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileSize: testFile.size })
    });

    expect(signedUrlResponse.status).toBe(200);
    const { url: signedUrl } = await signedUrlResponse.json() as SignedUrlResponse;
    console.log('Got signed URL:', signedUrl);

    // Step 2: Upload file to the signed URL
    const formData = new FormData();
    formData.append('file', testFile);

    const uploadResponse = await fetch(signedUrl, {
      method: 'POST',
      body: formData
    });

    expect(uploadResponse.status).toBe(200);
    const uploadResult = await uploadResponse.json() as PinataUploadResponse;
    console.log('Upload result:', uploadResult);
    
    // Should get back the CID and other file info (new Pinata API format)
    expect(uploadResult).toHaveProperty('data');
    expect(uploadResult.data).toHaveProperty('cid');
    expect(uploadResult.data.cid).toMatch(/^bafkrei[a-z0-9]+$/); // IPFS CIDv1 format
    
    const cid = uploadResult.data.cid;
    console.log('File uploaded with CID:', cid);

    // Step 3: Verify file is accessible via Pinata gateway with access token
    const gatewayUrl = `https://${PINATA_GATEWAY_URL}/ipfs/${cid}`;
    const retrieveResponse = await fetch(gatewayUrl, {
      headers: {
        'x-pinata-gateway-token': PINATA_GATEWAY_KEY!
      }
    });
    
    expect(retrieveResponse.status).toBe(200);
    const retrievedBuffer = await retrieveResponse.arrayBuffer();
    expect(retrievedBuffer.byteLength).toBe(imageBuffer.length);
    
    console.log('✅ File successfully uploaded and retrieved from Pinata!');
    console.log('CID:', cid);
    console.log('Gateway URL:', gatewayUrl);
  }, 30000); // 30 second timeout for upload

  it('should upload a file to private Pinata and retrieve with payment', async () => {
    // Create a test file for private upload
    const testContent = `Private test file uploaded at ${new Date().toISOString()}`;
    const testFile = new File([testContent], 'private-test-file.txt', { type: 'text/plain' });
    
    console.log('Private test file size:', testFile.size, 'bytes');

    // Step 1: Get signed URL for private upload with payment
    const signedUrlResponse = await fetchWithPayment(`${TEST_API_URL}/v1/pin/private`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileSize: testFile.size })
    });

    expect(signedUrlResponse.status).toBe(200);
    const { url: signedUrl } = await signedUrlResponse.json() as SignedUrlResponse;
    console.log('Got private signed URL:', signedUrl);

    // Step 2: Upload file to the signed URL
    const formData = new FormData();
    formData.append('file', testFile);

    const uploadResponse = await fetch(signedUrl, {
      method: 'POST',
      body: formData
    });

    expect(uploadResponse.status).toBe(200);
    const uploadResult = await uploadResponse.json() as PinataUploadResponse;
    console.log('Private upload result:', uploadResult);
    
    const cid = uploadResult.data.cid;
    console.log('Private file uploaded with CID:', cid);

    // Step 3: Retrieve the private file using our API with payment
    const retrieveResponse = await fetchWithPayment(`${TEST_API_URL}/v1/retrieve/private/${cid}`, {
      method: 'GET'
    });

    expect(retrieveResponse.status).toBe(200);
    const { url: accessUrl } = await retrieveResponse.json() as PrivateRetrieveResponse;
    console.log('Got private access URL:', accessUrl);

    // Step 4: Use the access URL to get the file content
    const fileResponse = await fetch(accessUrl);
    expect(fileResponse.status).toBe(200);
    const retrievedContent = await fileResponse.text();
    expect(retrievedContent).toBe(testContent);

    console.log('✅ Private file successfully uploaded and retrieved with payments!');
    console.log('Private CID:', cid);
    console.log('Access URL:', accessUrl);
  }, 30000); // 30 second timeout

  it('should show price scaling with file size', async () => {
    const fileSizes = [
      { size: 1024, label: '1KB' },
      { size: 1024 * 1024, label: '1MB' },
      { size: 5 * 1024 * 1024, label: '5MB' }
    ];

    console.log('\n=== Price Testing ===');

    for (const { size, label } of fileSizes) {
      // Get 402 response to see price
      const response = await fetch(`${TEST_API_URL}/v1/pin/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileSize: size })
      });

      expect(response.status).toBe(402);
      const paymentInfo = await response.json() as PaymentRequiredResponse;
      
      console.log(`${label} (${size} bytes):`, paymentInfo.accepts[0]);
      
      // Verify the pricing logic: 0.1 per GB * 12 months, minimum 0.0001
      const expectedPrice = Math.max(0.0001, (size / (1024 * 1024 * 1024)) * 0.1 * 12);
      console.log(`Expected price: $${expectedPrice.toFixed(4)}`);
    }
  });
});