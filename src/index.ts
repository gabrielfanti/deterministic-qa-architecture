import { createApp } from "./app/createApp";
import { env } from "./config/env";
import { log } from "./app/logger";

const app = createApp();

app.listen(env.port, "0.0.0.0", () => {
  log("info", "server.started", { port: env.port });
});
