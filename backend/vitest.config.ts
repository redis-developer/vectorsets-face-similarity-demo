import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["dist/**", "node_modules/**", "**/*.test.ts", "**/*.spec.ts"],
      //The lcov reporter is compatible with many CI tools and coverage services.
      reporter: ["text", "html", "lcov"],
    },
  },
});
