import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vite-plus/test";

const CORE = path.resolve(__dirname, "../../src/core");

const FORBIDDEN = [
  /@src\/(infrastructure|http|main|config)\//,
  /\.\.\/(infrastructure|http|main|config)\//,
  /^express$/,
  /^http-errors$/,
  /^@sentry\//,
  /^@aws-sdk\//,
  /^bcryptjs$/,
  /^jsonwebtoken$/,
  /^@prisma\//,
  /generated\/prisma/,
];

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return filesIn(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

describe("Dependency Rule: core never imports outward", () => {
  it.each(filesIn(CORE))("%s", (file) => {
    const source = readFileSync(file, "utf8");
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(
      (m) => m[1]!,
    );
    const outward = imports.filter((spec) =>
      FORBIDDEN.some((rule) => rule.test(spec)),
    );
    expect(outward).toEqual([]);
  });
});
