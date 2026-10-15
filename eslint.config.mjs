import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const VENDORED = ['src/components/ui/**']
// A function declaration and a statement that passes a block-bodied callback stand apart, from each other too.
const SET_APART = [
  'function',
  { selector: 'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]' },
  { selector: 'ExportDefaultDeclaration[declaration.type="FunctionDeclaration"]' },
  { selector: 'ExpressionStatement:has(:function[body.type="BlockStatement"])' },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next already ignores .next, out, build and next-env.d.ts.
  globalIgnores(['public/**', 'coverage/**']),
  {
    // The authored style: single quotes, no semicolons. The vendored shadcn/ui
    // primitives keep the CLI's own style, so they stay out of this block.
    files: ['app/**', 'src/**', 'functions/**', 'scripts/**', 'tests/**', '*.mjs', '*.mts', '*.ts'],
    ignores: VENDORED,
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
  {
    // Short single-purpose functions, shallow nesting, low complexity, at most three parameters, braces on every body
    // and blank lines between the steps of a function. The vendored primitives stay out, as above.
    files: ['**/*.{ts,tsx,js,mjs,cjs,mts}'],
    ignores: VENDORED,
    plugins: { '@stylistic': stylistic },
    rules: {
      'max-lines-per-function': ['error', { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true }],
      'max-depth': ['error', { max: 3 }],
      complexity: ['error', { max: 10, variant: 'classic' }],
      'max-params': ['error', { max: 3 }],
      // The last matching entry wins: every `any` entry relaxes the `always` entries above it, and the entries below
      // it override it again.
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'any', prev: 'block-like', next: 'block-like' },
        { blankLine: 'any', prev: ['case', 'default'], next: ['case', 'default'] },
        { blankLine: 'always', prev: ['const', 'let', 'export'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['const', 'let', 'export'] },
        { blankLine: 'any', prev: ['const', 'let', 'export'], next: ['const', 'let', 'export'] },
        { blankLine: 'always', prev: SET_APART, next: '*' },
        { blankLine: 'always', prev: '*', next: SET_APART },
        // Last, so that no `any` entry relaxes it: a `return () => { … }` after a block is block-like too.
        { blankLine: 'always', prev: '*', next: ['return', 'throw'] },
      ],
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      curly: ['error', 'all'],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'xxx'], location: 'anywhere' }],
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    files: ['**/*.{ts,tsx,mts}'],
    ignores: VENDORED,
    rules: {
      'max-params': 'off',
      '@typescript-eslint/max-params': ['error', { max: 3 }],
    },
  },
  {
    // Exported functions in .ts files state their types; React components keep the inferred return type.
    files: ['**/*.{ts,mts}'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'error' },
  },
])

export default eslintConfig
