import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const alias = {
  '@': path.resolve(dirname, './src'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'src/lib/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'components',
          include: ['src/components/**/*.test.tsx', 'src/components/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
    ],
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/components/**/*.tsx', 'src/lib/**/*.ts'],
      exclude: [
        'src/**/*.test.*',
        'src/**/__tests__/**',
        'src/**/*.stories.*',
        'src/generated/**',
        'src/lib/db/client.ts',
        'src/lib/auth/**',
        'src/lib/notifications/types.ts',
        'src/lib/notifications/emitter.ts',
        'src/lib/risk/types.ts',
        'src/lib/risk/server.ts',
        'src/lib/risk/batch.ts',
        'src/lib/env.ts',
        'src/lib/fonts.ts',
        'src/lib/db/index.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 45,
        statements: 60,
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/.next/**'],
    },
  },
});
