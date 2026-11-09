import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { env } from "#src/config/env";
import { Express } from "express";
import basicAuth from "express-basic-auth";
import swaggerUi from "swagger-ui-express";

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
);

export type SwaggerOptions = {
  enabled: boolean;
  users: Record<string, string>;
};

export const setupSwagger = (
  app: Express,
  { enabled, users }: SwaggerOptions,
) => {
  if (!enabled) return;
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Bee Techy Backend Template",
      version: "1.0.0",
    },
    servers: [
      {
        url: env.BASE_URL,
      },
    ],
  });

  const auth = basicAuth({
    challenge: true,
    users: users,
  });

  app.use("/api-docs", auth, swaggerUi.serve, swaggerUi.setup(document));
  app.use("/openapi.json", (_, res) => res.json(document));
};
