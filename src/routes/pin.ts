import { Hono } from "hono";
import { PinataSDK } from "pinata";
import type { Bindings } from "../utils/types";

type Network = "public" | "private";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/:network", async (c) => {
  const network = c.req.param("network") as Network;

  if (network !== "public" && network !== "private") {
    return c.json(
      { error: "Use either public or private routes" },
      { status: 400 },
    );
  }

  const fileSizeParam = c.req.query("fileSize");
  if (!fileSizeParam) {
    return c.json(
      { error: "Missing 'fileSize' query parameter" },
      { status: 400 },
    );
  }

  const fileSize = parseInt(fileSizeParam, 10);
  if (isNaN(fileSize) || fileSize <= 0) {
    return c.json(
      { error: "Invalid 'fileSize' query parameter" },
      { status: 400 },
    );
  }

  // TODO: Extract payer address from x402 v2 payment context
  const payerAddress = "";

  const pinata = new PinataSDK({
    pinataJwt: c.env.PINATA_JWT,
  });

  if (network === "public") {
    const url = await pinata.upload.public.createSignedURL({
      expires: 30,
      maxFileSize: fileSize + 10000,
      keyvalues: {
        account: payerAddress,
      },
    });
    return c.json({ url });
  }

  const url = await pinata.upload.private.createSignedURL({
    expires: 30,
    maxFileSize: fileSize + 10000,
    keyvalues: {
      account: payerAddress,
    },
  });
  return c.json({ url });
});

export default app;
