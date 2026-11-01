import "./instrument";
import * as http from "node:http";

import { prisma } from "@src/infrastructure/database/prisma";
import { createMainRouter } from "@src/http/routes";
import { createApp } from "@src/http/app";
import { env } from "@src/config/env";
import { bootstrapRepositories } from "./repositories.container";
import { bootstrapServices } from "./services.container";

let server: http.Server | null = null;

async function main(): Promise<void> {
  await prisma.$connect();

  const repos = bootstrapRepositories(prisma);
  const services = bootstrapServices(repos);
  const mainRouter = createMainRouter(services);
  const app = createApp(mainRouter);

  server = app.listen(env.PORT, () => {
    console.info(`Server is running on port ${env.PORT}`);
  });
}

async function gracefulShutdown(signal: string) {
  console.info(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.info("HTTP server closed.");
    });
  }

  await prisma.$disconnect();
  console.info("Database disconnected. Process exited.");
  process.exit(0);
}

main().catch(async () => {
  console.error("Failed to start application:");
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
