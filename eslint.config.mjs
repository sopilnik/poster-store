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
    // Short single-purpose functions, blank lines around declarations and before every return, shallow nesting, low
    // complexity and at most three parameters. The vendored primitives stay out, as above.
    files: ['**/*.{ts,tsx,js,mjs,cjs,mts}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'max-lines-per-function': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      complexity: ['error', 10],
      'max-params': ['error', 3],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['const', 'let'] },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
      ],
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
