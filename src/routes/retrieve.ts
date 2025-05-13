import { Hono } from "hono";
import { PinataSDK } from "pinata";
import { cors } from "hono/cors";
import { Bindings } from "../utils/types";
import { PaymentPayload } from "x402/types";

const app = new Hono<{ Bindings: Bindings }>();
app.use(cors());

app.get("/test", async (c) => {
  return c.text("Working!");
});

app.get("/private/:cid", async (c) => {
  try {
    const cid = c.req.param("cid");

    const header = c.req.header("X-PAYMENT");
    const headerParsed = header
      ? (JSON.parse(atob(header)) as PaymentPayload)
      : null;

    if (!cid) {
      return c.json({ message: "CID is required" }, 400);
    }

    console.log({env: c.env.PINATA_JWT});
    
    const pinata = new PinataSDK({
      pinataJwt: c.env.PINATA_JWT,
      pinataGateway: c.env.PINATA_GATEWAY_URL,
      pinataGatewayKey: c.env.PINATA_GATEWAY_KEY,
    });

    //  Make sure the requestor is allowed to access
    const files = await pinata.files.private
      .list()
      .keyvalues({ account: headerParsed?.payload.authorization.from || "" });
    
    console.log({files});
    if (!files.files || !files.files.find((f) => f.cid === cid)) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const url = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: 3000,
    });

    return c.json({ url: url });
  } catch (error) {
    console.error("Error retrieving from IPFS:", error);

    const isTimeout =
      error instanceof Error && error.message === "Request timed out";
    return c.json(
      {
        message: isTimeout ? "Request timed out" : "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      isTimeout ? 504 : 500
    );
  }
});

export default app;
