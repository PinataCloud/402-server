import { Hono } from "hono";
import { PinataSDK } from "pinata";
import type { Bindings } from "../utils/types";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/private/:cid", async (c) => {
  try {
    const cid = c.req.param("cid");

    if (!cid) {
      return c.json({ message: "CID is required" }, 400);
    }

    // TODO: Implement ownership verification using x402 v2 payment context
    // (v1 used X-PAYMENT header to check payer address against file keyvalues)

    const pinata = new PinataSDK({
      pinataJwt: c.env.PINATA_JWT,
      pinataGateway: c.env.PINATA_GATEWAY_URL,
    });

    const url = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: 3000,
    });

    return c.json({ url });
  } catch (error) {
    console.error("Error creating access link:", error);
    return c.json({ message: "Server error" }, 500);
  }
});

export default app;
