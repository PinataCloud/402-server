import { Hono } from "hono";
import pin from "./routes/pin";
import retrieve from "./routes/retrieve";
import { cors } from "hono/cors";
import { html } from "./main";
import type { Bindings } from "./utils/types"
import { createDynamicPaymentMiddleware } from "./utils/middleware";

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.use(
  createDynamicPaymentMiddleware(
    "0xaD73eafCAc4F4c6755DFc61770875fb8B6bC8A25" as `0x`,
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
