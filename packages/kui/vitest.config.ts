import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // 产物入口与 story 不计入覆盖率(barrel 只 re-export;story 归 Step 8)
      exclude: ['src/**/*.test.*', 'src/**/*.stories.*', 'src/**/index.ts', 'src/index.ts'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
