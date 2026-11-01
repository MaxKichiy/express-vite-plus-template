import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { env } from "@src/config/env";
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

export const setupSwagger = (app: Express) => {
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
    users: {
      admin: "admin",
    },
  });

  if (env.NODE_ENV !== "production") {
    app.use("/api-docs", auth, swaggerUi.serve, swaggerUi.setup(document));
    app.use("/openapi.json", (_, res) => res.json(document));
  }
};
