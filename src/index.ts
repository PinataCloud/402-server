import { Hono } from "hono";
import pin from "./routes/pin";
import retrieve from "./routes/retrieve";
import { cors } from "hono/cors";
import { html } from "./main";
import type { Bindings } from "./utils/types"
import { createDynamicPaymentMiddleware } from "./utils/middleware";

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.use((c, next) => {
  // Get network from environment variable, fallback to "base" for production
  const network = (c.env.NETWORK || "base") as "base" | "base-sepolia";
  
  return createDynamicPaymentMiddleware(
    "0xc900f41481B4F7C612AF9Ce3B1d16A7A1B6bd96E" as `0x`,
    {},
    null, // set this to facilitator from x402 library when using base sepolia
    network
  )(c, next);
});

app.get("/", (c) => {
  return c.html(html);
});

app.route("/v1/pin", pin);
app.route("/v1/retrieve", retrieve);

export default app;
