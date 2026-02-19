import { describe, it, expect, beforeAll } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

interface PrivateRetrieveResponse {
  url: string;
}

const TEST_API_URL =
  process.env.TEST_API_URL ||
  "https://402-server.pinata-marketing-enterprise.workers.dev";
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;

describe("End-to-End Retrieve Tests (Base Mainnet)", () => {
  let fetchWithPayment: typeof fetch;

  beforeAll(() => {
    if (!TEST_PRIVATE_KEY) {
      throw new Error("TEST_PRIVATE_KEY environment variable is required");
    }

    const account = privateKeyToAccount(TEST_PRIVATE_KEY as `0x${string}`);
    const signer = Object.assign(account, { chain: base });
    console.log("Test wallet address:", signer.address);

    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    fetchWithPayment = wrapFetchWithPayment(fetch, client);
  });

  it("should return 402 for retrieve without payment", async () => {
    // Use a dummy CID — we just want to verify the 402 challenge
    const response = await fetch(
      `${TEST_API_URL}/v1/retrieve/private/bafkreitestcid`,
      { method: "GET" },
    );

    expect(response.status).toBe(402);

    const paymentHeader = response.headers.get("PAYMENT-REQUIRED");
    expect(paymentHeader).toBeTruthy();

    const paymentInfo = JSON.parse(atob(paymentHeader!));
    expect(paymentInfo.accepts).toBeDefined();
    expect(paymentInfo.accepts[0].scheme).toBe("exact");
    expect(paymentInfo.accepts[0].network).toBe("eip155:8453");
    // Retrieve price is fixed at $0.001 (1000 microUSDC)
    expect(parseInt(paymentInfo.accepts[0].amount)).toBe(1000);

    console.log("Retrieve payment challenge:", paymentInfo.accepts[0]);
  });

  it("should upload a private file then retrieve it with payment", async () => {
    // Step 1: Upload a private file
    const testContent = `Retrieve test file at ${new Date().toISOString()}`;
    const testFile = new File([testContent], "retrieve-test.txt", {
      type: "text/plain",
    });

    const signedUrlResponse = await fetchWithPayment(
      `${TEST_API_URL}/v1/pin/private?fileSize=${testFile.size}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    expect(signedUrlResponse.status).toBe(200);
    const { url: signedUrl } = (await signedUrlResponse.json()) as { url: string };

    const formData = new FormData();
    formData.append("file", testFile);
    const uploadResponse = await fetch(signedUrl, {
      method: "POST",
      body: formData,
    });

    expect(uploadResponse.status).toBe(200);
    const uploadResult = (await uploadResponse.json()) as { data: { cid: string } };
    const cid = uploadResult.data.cid;
    console.log("Uploaded private file with CID:", cid);

    // Step 2: Retrieve with payment
    const retrieveResponse = await fetchWithPayment(
      `${TEST_API_URL}/v1/retrieve/private/${cid}`,
      { method: "GET" },
    );

    expect(retrieveResponse.status).toBe(200);
    const { url: accessUrl } =
      (await retrieveResponse.json()) as PrivateRetrieveResponse;
    console.log("Got access URL:", accessUrl);

    // Step 3: Verify file content via access URL
    const fileResponse = await fetch(accessUrl);
    expect(fileResponse.status).toBe(200);
    const retrievedContent = await fileResponse.text();
    expect(retrievedContent).toBe(testContent);

    console.log("Retrieved file content matches original");
  }, 30000);
});
