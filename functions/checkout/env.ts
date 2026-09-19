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
  return {
    STRIPE_SECRET_KEY: required(raw, 'STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: required(raw, 'STRIPE_WEBHOOK_SECRET'),
    SITE_URL: required(raw, 'SITE_URL'),
  }
}
