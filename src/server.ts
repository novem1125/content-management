import dotenv from "dotenv";
dotenv.config();

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import authRouter from "../src/Features/modules/auth/auth.router";
import { contentRoutes } from "../src/Features/modules/contents/contents.router";
import { authMiddleware } from "./core/auth";
import { connectKafkaProducer, disconnectKafkaProducer } from "./core/kafka";
import { authPlugin } from "./core/auth.plugin";
import { followersRoutes } from "./Features/modules/followers/followers.router";

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;

// Global middleware
// app.use('*', authMiddleware);
// Routes
app.route("/api/auth", authRouter);

const protectedApp = new Hono();

protectedApp.use("*", authPlugin);

app.route("/api/contents", contentRoutes);
app.route("/api/follow", followersRoutes);

app.route("/api", protectedApp);

const server = serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
    connectKafkaProducer().catch((err) => {
      console.warn(
        "[Kafka] Producer startup connection attempt pending/deferred:",
        err.message,
      );
    });
  },
);

const gracefulShutdown = async () => {
  console.log("Shutting down server...");
  server.close(async () => {
    await disconnectKafkaProducer();
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
