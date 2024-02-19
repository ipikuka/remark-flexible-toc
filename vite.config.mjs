import { defineConfig } from "vite";

/// <reference types="vitest" />
export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
  },
});
