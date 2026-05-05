import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['dist/**', 'node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
