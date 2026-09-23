export type Env = {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  SITE_URL: string
}

type RawEnv = Partial<Record<keyof Env, string>>

function required(raw: RawEnv, name: keyof Env): string {
  const value = raw[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function readEnv(raw: RawEnv): Env {
  const stripeSecretKey = required(raw, 'STRIPE_SECRET_KEY')
  // The checkout page promises that nothing is charged, so a live key is refused outright.
  if (!/^(rk|sk)_test_/.test(stripeSecretKey)) {
    throw new Error('STRIPE_SECRET_KEY must be a test-mode key (rk_test_ or sk_test_)')
  }
  return {
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: required(raw, 'STRIPE_WEBHOOK_SECRET'),
    SITE_URL: required(raw, 'SITE_URL'),
  }
}
