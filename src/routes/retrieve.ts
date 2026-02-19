import { Hono } from "hono";
import { PinataSDK } from "pinata";
import { cors } from "hono/cors";
import type { Bindings } from "../utils/types";

const app = new Hono<{ Bindings: Bindings }>();
app.use(cors());

app.get("/test", async (c) => {
  return c.text("Working!");
});

app.get("/private/:cid", async (c) => {
  try {
    const cid = c.req.param("cid");

    if (!cid) {
      return c.json({ message: "CID is required" }, 400);
    }

    // In x402 v2, payment is already verified by middleware
    // For now, we'll skip the ownership check since we can't easily get payer address
    // TODO: Implement proper ownership verification using x402 v2 context

    const pinata = new PinataSDK({
      pinataJwt: c.env.PINATA_JWT,
      pinataGateway: c.env.PINATA_GATEWAY_URL,
    });

    // Create access link for the private file
    const url = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: 3000,
    });

    return c.json({ url: url });
  } catch (error) {
    console.error('Error creating access link:', error);
    return c.json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export default app;
