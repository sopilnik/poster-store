import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next already ignores .next, out, build and next-env.d.ts.
  globalIgnores(['public/**', 'coverage/**']),
  {
    // The authored style: single quotes, no semicolons. The vendored shadcn/ui
    // primitives keep the CLI's own style, so they stay out of this block.
    files: ['app/**', 'src/**', 'functions/**', 'scripts/**', 'tests/**', '*.mjs', '*.mts', '*.ts'],
    ignores: ['src/components/ui/**'],
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never'],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/posters/templates/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../*'], message: 'Use the @/ alias across src modules' }] },
      ],
    },
  },
  {
    files: ['src/posters/**/*.{ts,tsx}', 'src/og/**/*.{ts,tsx}'],
    ignores: [
      'src/posters/rasterize.ts',
      'src/posters/**/*.test.{ts,tsx}',
    ],
    rules: {
      'no-restricted-globals': ['error', 'Date', 'performance'],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['next', 'next/*', '*.css', '*.module.css'] },
            { group: ['../*'], message: 'Use the @/ alias across src modules' },
          ],
        },
      ],
    },
  },
  {
    // Templates keep the same-module `../types` and `../prng` imports; they only
    // stay clear of Next.js and CSS since they must render outside the app.
    files: ['src/posters/templates/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['next', 'next/*', '*.css', '*.module.css'] }] },
      ],
    },
  },
])

export default eslintConfig
