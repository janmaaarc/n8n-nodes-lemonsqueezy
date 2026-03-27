import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['nodes/**/*.ts', 'credentials/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        '**/resources/*.ts',
        // Node execution files require full n8n context mocking
        '**/LemonSqueezy.node.ts',
        '**/LemonSqueezyTrigger.node.ts',
        '**/handlers.ts',
        '**/api.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
