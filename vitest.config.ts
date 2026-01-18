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
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
