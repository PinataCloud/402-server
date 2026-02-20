import { Hono } from "hono";
import { PinataSDK } from "pinata";
import { getPayerAddress, type Bindings } from "../utils/types";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/private/:cid", async (c) => {
  try {
    const cid = c.req.param("cid");

    if (!cid) {
      return c.json({ message: "CID is required" }, 400);
    }

    const payerAddress = getPayerAddress(c);
    if (!payerAddress) {
      return c.json({ message: "Payment required" }, 402);
    }

    const pinata = new PinataSDK({
      pinataJwt: c.env.PINATA_JWT,
      pinataGateway: c.env.PINATA_GATEWAY_URL,
    });

    // Verify the payer owns this file (uploaded with their address as keyvalue)
    const files = await pinata.files.private
      .list()
      .keyvalues({ account: payerAddress });

    if (!files.files || !files.files.find((f) => f.cid === cid)) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const url = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: 3000,
    });

    return c.json({ url });
  } catch (error) {
    console.error("Error creating access link:", error);
    return c.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default app;
