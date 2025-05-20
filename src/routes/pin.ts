import { Hono } from 'hono'
import type { PaymentPayload } from 'x402/types';
import { PinataSDK } from 'pinata';
import { cors } from "hono/cors"
import type { Bindings } from '../utils/types';

type Network = "public" | "private"

const app = new Hono<{ Bindings: Bindings }>()

app.use(cors())

app.post("/:network", async (c) => {

  const { fileSize } = await c.req.json()

  const network = c.req.param('network') as Network

  const header = c.req.header('X-PAYMENT')
  const headerParsed = header ? JSON.parse(atob(header)) as PaymentPayload : null

  if (!fileSize) {
    return c.json({ error: "Missing fileSize " }, { status: 400 })
  }

  if (network !== 'public' && network !== 'private') {
    return c.json({ error: "Use either public or private routes" }, { status: 400 })
  }

  const pinata = new PinataSDK({
    pinataJwt: c.env.PINATA_JWT
  })

  if (network === 'public') {
    const url = await pinata.upload.public.createSignedURL({
      expires: 30,
      maxFileSize: fileSize + 10000,
      keyvalues: {
        account: headerParsed?.payload.authorization.from || ""
      }
    })
    return c.json({ url: url });
  }
  const url = await pinata.upload.private.createSignedURL({
    expires: 30,
    maxFileSize: fileSize + 10000,
    keyvalues: {
      account: headerParsed?.payload.authorization.from || ""
    }
  })
  return c.json({ url: url });
});

export default app
