import { Hono } from "hono";
import { paymentMiddleware } from "x402-hono";
import { PaymentPayload } from "x402/types";
import { PinataSDK } from "pinata";
import { cors } from "hono/cors";
import { Bindings } from "../utils/types";

type Network = "public" | "private";

const app = new Hono<{ Bindings: Bindings }>();
app.use(cors());

app.get("/test", async (c) => {
  return c.text("Working!");
});

app.get("/:network/:cid", async (c) => {
  try {
    console.log("Request made...");
    const network = c.req.param("network") as Network;
    const cid = c.req.param("cid");
    console.log({ network, cid });
    if (!cid) {
      return c.json({ message: "CID is required" }, 400);
    }

    if (network !== "public" && network !== "private") {
      return c.json({ message: "Network must be 'public' or 'private'" }, 400);
    }

    if (!c.env.PINATA_JWT) {
      console.error("Missing PINATA_JWT environment variable");
      return c.json({ message: "Server configuration error" }, 500);
    }

    const pinata = new PinataSDK({
      pinataJwt: c.env.PINATA_JWT,
      pinataGateway: c.env.PINATA_GATEWAY_URL,
      pinataGatewayKey: c.env.PINATA_GATEWAY_KEY,
    });

    let response: any;
    let url = "";
    if (network === "public") {
      url = `https://${c.env.PINATA_GATEWAY_URL}/ipfs/${cid}?pinataGatewayToken=${c.env.PINATA_GATEWAY_KEY}`;
      response = await fetch(url);
    } else {
      url = await pinata.gateways.private.createAccessLink({
        cid: cid,
        expires: 3000,
      });
      response = await fetch(url);
    }

    if (!response.ok) {
      return c.text(`Failed to fetch from ${url}`, response.status);
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    c.header("content-type", contentType);

    return c.newResponse(response.body, 200);
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
