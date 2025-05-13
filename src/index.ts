import { Context, Hono, Next } from "hono";
import pin from "./routes/pin";
import retrieve from "./routes/retrieve";
import { cors } from "hono/cors";
import { paymentMiddleware } from "x402-hono";
import { createFacilitatorConfig } from "@coinbase/x402";
import { html } from "./main";

type Bindings = {
  PINATA_JWT: string;
  PINATA_GATEWAY_URL: string;
};

const PRICE_PER_GB = 0.1;
const MONTHS = 12;

const app = new Hono<{ Bindings: Bindings }>();
app.use(cors());

const createDynamicPaymentMiddleware = (
  receivingWallet: any,
  baseConfig: any,
  facilitatorConfig: any
) => {
  return async (c: Context, next: Next) => {
    if(!facilitatorConfig) {
      //  Custom config for mainnet to ensure we can get envs from context
      facilitatorConfig = createFacilitatorConfig(c.env.CDP_API_KEY_ID, c.env.CDP_API_KEY_SECRET)      
      console.log({facilitatorConfig})
    }
    if (c.req.method === "POST") {
      const { fileSize } = await c.req.json();

      const fileSizeInGB = fileSize / (1024 * 1024 * 1024);
      const price = fileSizeInGB * PRICE_PER_GB * MONTHS;
      const priceToUse = price >= 0.0001 ? price : 0.0001;
      baseConfig = {
        "/pin/public": {
          price: `$${priceToUse.toFixed(4)}`,
          network: "base",
          config: {
            description: "Pay2Pin",
          },
        },
        "/pin/private": {
          price: `$${priceToUse.toFixed(4)}`,
          network: "base",
          config: {
            description: "Pay2Pin",
          },
        },
      };
    } else {
      baseConfig = {
        "/retrieve/private/*": {
          price: `$0.0001`,
          network: "base",
          config: {
            description: "Pay2Read",
          },
        },        
      }
    }

    const dynamicPaymentMiddleware = paymentMiddleware(
      receivingWallet,
      baseConfig,
      facilitatorConfig
    );

    return dynamicPaymentMiddleware(c, next);
  };
};

app.use(
  createDynamicPaymentMiddleware(
    "0xaD73eafCAc4F4c6755DFc61770875fb8B6bC8A25",
    {},
    null // set this to facilitator from x402 library when using base sepolia
  )
);

app.get("/", (c) => {
  return c.html(html);
});

app.route("/v1/pin", pin);
app.route("/v1/retrieve", retrieve);

export default app;
