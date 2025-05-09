import { Context, Hono, Next } from "hono";
import pin from "./routes/pin";
import retrieve from "./routes/retrieve";
import { cors } from "hono/cors";
import { paymentMiddleware } from "x402-hono";

type Bindings = {
  PINATA_JWT: string;
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
    if (c.req.method === "POST") {
      const { fileSize } = await c.req.json();

      const fileSizeInGB = fileSize / (1024 * 1024 * 1024);
      const price = fileSizeInGB * PRICE_PER_GB * MONTHS;
      console.log(price);
      const priceToUse = price >= 0.0001 ? price : 0.0001;
      console.log({priceToUse})
      baseConfig = {
        "/pin/public": {
          price: `$${priceToUse.toFixed(4)}`,
          network: "base-sepolia",
          config: {
            description: "Pay2Pin",
          },
        },
        "/pin/private": {
          price: `$${priceToUse.toFixed(4)}`,
          network: "base-sepolia",
          config: {
            description: "Pay2Pin",
          },
        },
      };
    } else {
      baseConfig = {
        "/retrieve/private/*": {
          price: `$0.0001`,
          network: "base-sepolia",
          config: {
            description: "Pay2Read",
          },
        },        
      }
    }

    console.log(baseConfig);

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
    { url: "https://x402.org/facilitator" }
  )
);

app.get("/", (c) => {
  return c.text("Hello");
});

app.route("/pin", pin);
app.route("/retrieve", retrieve);

export default app;
