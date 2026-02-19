import { describe, it, expect, beforeAll } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

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
    scheme: string;
    network: string;
    amount: string;
    payTo: string;
    [key: string]: unknown;
  }>;
}

interface PrivateRetrieveResponse {
  url: string;
}

const TEST_API_URL =
  process.env.TEST_API_URL ||
  "https://402-server.pinata-marketing-enterprise.workers.dev";
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;
const PINATA_GATEWAY_KEY = process.env.PINATA_GATEWAY_KEY;

describe("End-to-End File Upload Tests (Base Mainnet)", () => {
  let fetchWithPayment: typeof fetch;

  beforeAll(() => {
    if (!TEST_PRIVATE_KEY) {
      throw new Error("TEST_PRIVATE_KEY environment variable is required");
    }

    // Create signer from private key with Base chain configured
    const account = privateKeyToAccount(TEST_PRIVATE_KEY as `0x${string}`);
    const signer = Object.assign(account, { chain: base });
    console.log("Test wallet address:", signer.address);

    // Create x402 v2 client and register EVM scheme
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    // Wrap fetch with payment handling (v2 API)
    fetchWithPayment = wrapFetchWithPayment(fetch, client);
  });

  it("should upload timestamped file to public Pinata and get CID", async () => {
    // Create a timestamped test file to ensure unique CID
    const testContent = `Public test file uploaded at ${new Date().toISOString()} - ${Date.now()}`;
    const testFile = new File([testContent], `public-test-${Date.now()}.txt`, {
      type: "text/plain",
    });

    console.log("Test file size:", testFile.size, "bytes");

    // Step 1: Get signed URL with payment
    const signedUrlResponse = await fetchWithPayment(
      `${TEST_API_URL}/v1/pin/public?fileSize=${testFile.size}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(signedUrlResponse.status).toBe(200);
    const { url: signedUrl } =
      (await signedUrlResponse.json()) as SignedUrlResponse;
    console.log("Got signed URL:", signedUrl);

    // Step 2: Upload file to the signed URL
    const formData = new FormData();
    formData.append("file", testFile);

    const uploadResponse = await fetch(signedUrl, {
      method: "POST",
      body: formData,
    });

    expect(uploadResponse.status).toBe(200);
    const uploadResult = (await uploadResponse.json()) as PinataUploadResponse;
    console.log("Upload result:", uploadResult);

    // Should get back the CID and other file info (new Pinata API format)
    expect(uploadResult).toHaveProperty("data");
    expect(uploadResult.data).toHaveProperty("cid");
    expect(uploadResult.data.cid).toMatch(/^baf[a-z0-9]+$/); // IPFS CIDv1 format (bafkrei for files, bafybei for directories/DAGs)

    const cid = uploadResult.data.cid;
    console.log("File uploaded with CID:", cid);

    // Step 3: Verify file is accessible via Pinata gateway
    const gatewayUrl = `https://${PINATA_GATEWAY_URL}/ipfs/${cid}?pinataGatewayToken=${PINATA_GATEWAY_KEY}`;
    const retrieveResponse = await fetch(gatewayUrl);

    expect(retrieveResponse.status).toBe(200);
    const retrievedContent = await retrieveResponse.text();
    expect(retrievedContent).toBe(testContent);

    console.log("✅ File successfully uploaded and retrieved from Pinata!");
    console.log("CID:", cid);
    console.log("Gateway URL:", gatewayUrl);
  }, 30000); // 30 second timeout for upload

  it("should upload a file to private Pinata and retrieve with payment", async () => {
    // Create a test file for private upload
    const testContent = `Private test file uploaded at ${new Date().toISOString()}`;
    const testFile = new File([testContent], "private-test-file.txt", {
      type: "text/plain",
    });

    console.log("Private test file size:", testFile.size, "bytes");

    // Step 1: Get signed URL for private upload with payment
    const signedUrlResponse = await fetchWithPayment(
      `${TEST_API_URL}/v1/pin/private?fileSize=${testFile.size}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(signedUrlResponse.status).toBe(200);
    const { url: signedUrl } =
      (await signedUrlResponse.json()) as SignedUrlResponse;
    console.log("Got private signed URL:", signedUrl);

    // Step 2: Upload file to the signed URL
    const formData = new FormData();
    formData.append("file", testFile);

    const uploadResponse = await fetch(signedUrl, {
      method: "POST",
      body: formData,
    });

    expect(uploadResponse.status).toBe(200);
    const uploadResult = (await uploadResponse.json()) as PinataUploadResponse;
    console.log("Private upload result:", uploadResult);

    const cid = uploadResult.data.cid;
    console.log("Private file uploaded with CID:", cid);

    // Step 3: Retrieve the private file using our API with payment
    const retrieveResponse = await fetchWithPayment(
      `${TEST_API_URL}/v1/retrieve/private/${cid}`,
      {
        method: "GET",
      },
    );

    expect(retrieveResponse.status).toBe(200);
    const { url: accessUrl } =
      (await retrieveResponse.json()) as PrivateRetrieveResponse;
    console.log("Got private access URL:", accessUrl);

    // Step 4: Use the access URL to get the file content
    const fileResponse = await fetch(accessUrl);
    expect(fileResponse.status).toBe(200);
    const retrievedContent = await fileResponse.text();
    expect(retrievedContent).toBe(testContent);

    console.log(
      "✅ Private file successfully uploaded and retrieved with payments!",
    );
    console.log("Private CID:", cid);
    console.log("Access URL:", accessUrl);
  }, 30000); // 30 second timeout

  it("should show price scaling with file size", async () => {
    const fileSizes = [
      { size: 1024, label: "1KB" },
      { size: 1024 * 1024, label: "1MB" },
      { size: 5 * 1024 * 1024, label: "5MB" },
    ];

    console.log("\n=== Price Scaling ===");

    for (const { size, label } of fileSizes) {
      const response = await fetch(
        `${TEST_API_URL}/v1/pin/public?fileSize=${size}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      expect(response.status).toBe(402);

      const paymentHeader = response.headers.get("PAYMENT-REQUIRED");
      expect(paymentHeader).toBeTruthy();

      const paymentInfo = JSON.parse(
        atob(paymentHeader!),
      ) as PaymentRequiredResponse;

      const actualMicroUSDC = parseInt(paymentInfo.accepts[0].amount);
      // Server uses toFixed(4) which rounds to 4 decimal places of dollars
      const rawPrice = Math.max(
        0.001,
        (size / (1024 * 1024 * 1024)) * 0.1 * 12,
      );
      const expectedMicroUSDC = Math.round(
        parseFloat(rawPrice.toFixed(4)) * 1000000,
      );

      console.log(
        `${label}: expected ${expectedMicroUSDC} microUSDC, got ${actualMicroUSDC} microUSDC`,
      );
      expect(actualMicroUSDC).toBe(expectedMicroUSDC);
    }
  });

  it.each([
    { size: 1024, label: "1KB" },
    { size: 100 * 1024, label: "100KB" },
    { size: 1024 * 1024, label: "1MB" },
  ])(
    "should upload and retrieve $label file with correct payment",
    async ({ size, label }) => {
      // Generate test content at the specified size
      const content = "x".repeat(size);
      const testFile = new File(
        [content],
        `size-test-${label}-${Date.now()}.txt`,
        { type: "text/plain" },
      );

      // Step 1: Check the 402 price before paying
      const priceCheck = await fetch(
        `${TEST_API_URL}/v1/pin/private?fileSize=${testFile.size}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(priceCheck.status).toBe(402);
      const challengeHeader = priceCheck.headers.get("PAYMENT-REQUIRED");
      const challenge = JSON.parse(
        atob(challengeHeader!),
      ) as PaymentRequiredResponse;
      const chargedMicroUSDC = parseInt(challenge.accepts[0].amount);
      console.log(`${label} upload price: ${chargedMicroUSDC} microUSDC`);

      // Step 2: Pay and get signed URL
      const signedUrlResponse = await fetchWithPayment(
        `${TEST_API_URL}/v1/pin/private?fileSize=${testFile.size}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(signedUrlResponse.status).toBe(200);
      const { url: signedUrl } =
        (await signedUrlResponse.json()) as SignedUrlResponse;

      // Step 3: Upload
      const formData = new FormData();
      formData.append("file", testFile);
      const uploadResponse = await fetch(signedUrl, {
        method: "POST",
        body: formData,
      });
      expect(uploadResponse.status).toBe(200);
      const uploadResult =
        (await uploadResponse.json()) as PinataUploadResponse;
      const cid = uploadResult.data.cid;
      console.log(`${label} uploaded: CID ${cid}`);

      // Step 4: Pay to retrieve
      const retrieveResponse = await fetchWithPayment(
        `${TEST_API_URL}/v1/retrieve/private/${cid}`,
        { method: "GET" },
      );
      expect(retrieveResponse.status).toBe(200);
      const { url: accessUrl } =
        (await retrieveResponse.json()) as PrivateRetrieveResponse;

      // Step 5: Verify content
      const fileResponse = await fetch(accessUrl);
      expect(fileResponse.status).toBe(200);
      const retrieved = await fileResponse.text();
      expect(retrieved.length).toBe(size);
      expect(retrieved).toBe(content);

      console.log(`${label}: upload + retrieve verified`);
    },
    60000,
  );
});
