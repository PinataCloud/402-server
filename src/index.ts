import { Hono } from 'hono'
import { paymentMiddleware } from "x402-hono";
import pin from "./routes/pin"

type Bindings = {
  PINATA_JWT: string;
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(paymentMiddleware(
  "0xaD73eafCAc4F4c6755DFc61770875fb8B6bC8A25", // your receiving wallet address
  {  // Route configurations for protected endpoints
    "/pin/public": {
      price: "$0.10",
      network: "base-sepolia",
      config: {
        description: "Pay2Pin",
      }
    },
    "/pin/private": {
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

app.route("/pin", pin)

export default app
