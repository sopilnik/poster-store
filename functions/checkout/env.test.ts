// @vitest-environment node
import { readEnv } from './env'

const RAW = {
  STRIPE_SECRET_KEY: 'sk_test_x',
  STRIPE_WEBHOOK_SECRET: 'whsec_x',
  SITE_URL: 'https://example.test',
}

test('accepts a restricted test key', () => {
  const env = readEnv({ ...RAW, STRIPE_SECRET_KEY: 'rk_test_x' })
  expect(env.STRIPE_SECRET_KEY).toBe('rk_test_x')
})

test('accepts a secret test key', () => {
  const env = readEnv({ ...RAW, STRIPE_SECRET_KEY: 'sk_test_x' })
  expect(env.STRIPE_SECRET_KEY).toBe('sk_test_x')
})

test('refuses a live key', () => {
  expect(() => readEnv({ ...RAW, STRIPE_SECRET_KEY: 'sk_live_x' })).toThrow(
    'STRIPE_SECRET_KEY must be a test-mode key (rk_test_ or sk_test_)',
  )
})

test('refuses a key of another shape', () => {
  expect(() => readEnv({ ...RAW, STRIPE_SECRET_KEY: 'test-secret' })).toThrow(
    'STRIPE_SECRET_KEY must be a test-mode key (rk_test_ or sk_test_)',
  )
})

test('still reports a missing key first', () => {
  const rest = { STRIPE_WEBHOOK_SECRET: RAW.STRIPE_WEBHOOK_SECRET, SITE_URL: RAW.SITE_URL }
  expect(() => readEnv(rest)).toThrow('Missing environment variable: STRIPE_SECRET_KEY')
})
