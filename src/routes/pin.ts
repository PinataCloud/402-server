import { Hono } from 'hono'
import { PinataSDK } from 'pinata';
import { cors } from "hono/cors"
import type { Bindings } from '../utils/types';

type Network = "public" | "private"

const app = new Hono<{ Bindings: Bindings }>()

app.use(cors())

app.post("/:network", async (c) => {
  const network = c.req.param('network') as Network

  // Validate network parameter is provided and valid
  if (!network) {
    return c.json({ error: "Network parameter is required in the URL path (e.g., /v1/pin/public or /v1/pin/private)" }, { status: 400 })
  }

  if (network !== 'public' && network !== 'private') {
    return c.json({ error: "Network must be either 'public' or 'private'" }, { status: 400 })
  }

  // Get fileSize from query parameter (required for pricing)
  const fileSizeParam = c.req.query('fileSize');
  if (!fileSizeParam) {
    return c.json({ error: "Missing 'fileSize' query parameter. Must be a number in bytes." }, { status: 400 })
  }

  const fileSize = parseInt(fileSizeParam, 10);
  if (isNaN(fileSize) || fileSize <= 0) {
    return c.json({ error: "Invalid 'fileSize' query parameter. Must be a positive number in bytes." }, { status: 400 })
  }

  // In x402 v2, payment is verified by middleware before reaching here
  // Payment metadata might be in context, but for now we'll use empty string
  // TODO: Extract payer address from x402 v2 context if needed
  const payerAddress = "";

  const pinata = new PinataSDK({
    pinataJwt: c.env.PINATA_JWT
  })

  if (network === 'public') {
    const url = await pinata.upload.public.createSignedURL({
      expires: 30,
      maxFileSize: fileSize + 10000,
      keyvalues: {
        account: payerAddress
      }
    })
    return c.json({ url: url });
  }
  const url = await pinata.upload.private.createSignedURL({
    expires: 30,
    maxFileSize: fileSize + 10000,
    keyvalues: {
      account: payerAddress
    }
  })
  return c.json({ url: url });
});

export default app
