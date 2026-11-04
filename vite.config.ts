import path from "node:path";

import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "#src": path.resolve(__dirname, "src"),
    },
  },
  lint: {
    ignorePatterns: ["build/**", "src/generated/**", "tests/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": ["error", { allow: ["info"] }],
      "no-duplicate-imports": ["error", { includeExports: true }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
    overrides: [
      {
        files: ["src/core/**/*", "**/src/core/**/*"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["../**"],
                  message: "Core moudle are restricted from importing outside",
                },
                {
                  regex: "^(src|@|#|\\.|~)(?!/core).*$",
                  message:
                    "Core is isolated and cannot depend on external application layers.",
                },
              ],
            },
          ],
        },
      },
    ],
  },
  test: {
    environment: "node",
    env: {
      APP_URL: "http://localhost:3000",
      AWS_SES_SENDER: "test@example.com",
      AWS_SES_REGION: "us-east-1",
      BASE_URL: "http://localhost:4000",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      GOOGLE_OAUTH_CLIENT_ID: "test-google-client-id",
      GOOGLE_OAUTH_CLIENT_SECRET: "test-google-client-secret",
      JWT_SECRET_KEY: "test-secret-key",
      NODE_ENV: "test",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/integration/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      exclude: [
        "src/generated/**",
        "src/main/index.ts",
        "src/main/instrument.ts",
        "src/infrastructure/database/prisma.ts",
      ],
      thresholds: { 100: true },
    },
  },
  fmt: {
    ignorePatterns: ["build/**", "src/generated/**"],
    printWidth: 100,
    sortImports: true,
  },
});
