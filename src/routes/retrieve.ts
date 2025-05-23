import { Hono } from "hono";
import { PinataSDK } from "pinata";
import { cors } from "hono/cors";
import type { Bindings } from "../utils/types";
import type { PaymentPayload } from "x402/types";

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

    const pinata = new PinataSDK({
      pinataJwt: c.env.PINATA_JWT,
      pinataGateway: c.env.PINATA_GATEWAY_URL,
      pinataGatewayKey: c.env.PINATA_GATEWAY_KEY,
    });

    //  Make sure the requestor is allowed to access
    const files = await pinata.files.private
      .list()
      .keyvalues({ account: headerParsed?.payload.authorization.from || "" });

    if (!files.files || !files.files.find((f) => f.cid === cid)) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const url = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: 3000,
    });

    return c.json({ url: url });
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

export default app;
