import { defineConfig } from "vite";

/// <reference types="vitest" />
export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: [
        ["lcov", { projectRoot: "./src" }],
        ["json", { file: "coverage.json" }],
      ],
      exclude: ["archive", "tests", "**/*.d.ts"],
    },
  },
});
