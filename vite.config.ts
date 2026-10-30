import path from "node:path";

import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
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
  },
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["dotenv/config"],
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
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**"],
    },
  },
  fmt: {
    ignorePatterns: ["build/**", "src/generated/**"],
    printWidth: 100,
    sortImports: true,
  },
});
