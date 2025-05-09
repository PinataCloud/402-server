import { Hono } from 'hono'
import { paymentMiddleware } from "x402-hono";
import pin from "./routes/pin"
import retrieve from "./routes/retrieve";
import { cors } from 'hono/cors';

type Bindings = {
  PINATA_JWT: string;
}

const app = new Hono<{ Bindings: Bindings }>()
app.use(cors());
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
    }, 
    "/retrieve/private/*": {
      price: "$0.0001",
      network: "base-sepolia",
      config: {
        description: "Pay2Read",
      }
    }, 
    "/retrieve/public/*": {
      price: "$0.0001",
      network: "base-sepolia",
      config: {
        description: "Pay2Read",
      }
    }, 
    "/retrieve/test": {
      price: "$0.001", 
      network: "base-sepolia", 
      config: {
        description: "Pay2Read"
      }
    }
  },
  {
    url: "https://x402.org/facilitator", // Facilitator URL for Base Sepolia testnet.
  }
));

app.get("/", (c) => {
  return c.text("Hello")
})
app.route("/pin", pin)
app.route("/retrieve", retrieve)

export default app
