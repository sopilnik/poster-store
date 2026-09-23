import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': `${import.meta.dirname}/src` } },
  test: {
    globals: true,
    environment: 'jsdom',
    isolate: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'functions/**/*.test.ts', 'app/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'functions/**', 'app/**'],
      exclude: ['**/*.test.*', '**/*.md', 'src/posters/__golden__/**'],
      reporter: ['text', 'lcov'],
    },
  },
})
