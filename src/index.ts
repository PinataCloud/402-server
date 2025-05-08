import { Hono } from 'hono'
import { paymentMiddleware } from "x402-hono";
import { PinataSDK } from 'pinata';
import { Network } from 'inspector/promises';

type Bindings = {
  PINATA_JWT: string;
}

type Network =  "public" | "private"

const app = new Hono<{ Bindings: Bindings }>()

app.use(paymentMiddleware(
  "0xaD73eafCAc4F4c6755DFc61770875fb8B6bC8A25", // your receiving wallet address
  {  // Route configurations for protected endpoints
    "/public/pin": {
      price: "$0.10",
      network: "base-sepolia",
      config: {
        description: "Pay2Pin",
      }
    },
    "/private/pin": {
      price: "$0.10",
      network: "base-sepolia",
      config: {
        description: "Pay2Pin",
      }
    }
  },
  {
    url: "https://x402.org/facilitator", // Facilitator URL for Base Sepolia testnet.
  }
));

app.post("/:network/pin", async (c) => {

  const { buyer, fileSize  } = await c.req.json()

  const network = c.req.param('network') as Network

  if(!buyer || !fileSize){
    return c.json({ error: "Missing Buyer address or fileSize " }, { status: 400 })
  }

  if(network !== 'public' && network !== 'private'){
    return c.json({ error: "Use either public or private routes" }, { status: 400 })
  }

  const pinata = new PinataSDK({
    pinataJwt: c.env.PINATA_JWT
  })

  if(network === 'public'){
    const url = await pinata.upload.public.createSignedURL({
      expires: 30,
      maxFileSize: fileSize + 10000,
      keyvalues: {
        account: buyer
      }
    })
    return c.json({ url: url });
  } else {
    const url = await pinata.upload.private.createSignedURL({
      expires: 30,
      maxFileSize: fileSize + 10000,
      keyvalues: {
        account: buyer
      }
    })
    return c.json({ url: url });
  }


});

export default app
