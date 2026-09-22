import Stripe from 'stripe'
import { readEnv, type Env } from './env'
import { handle } from './handler'
import type { StripeEventLike, StripeLike } from './session'

function makeStripe(key: string): StripeLike {
  const client = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
  const cryptoProvider = Stripe.createSubtleCryptoProvider()

  return {
    checkout: {
      sessions: {
        create: (params, options) =>
          client.checkout.sessions.create(params as unknown as Stripe.Checkout.SessionCreateParams, options),
        retrieve: id => client.checkout.sessions.retrieve(id),
      },
    },
    webhooks: {
      constructEventAsync: async (payload, signature, secret) => {
        const event = await client.webhooks.constructEventAsync(payload, signature, secret, undefined, cryptoProvider)
        return event as unknown as StripeEventLike
      },
    },
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handle(request, readEnv(env), makeStripe)
    } catch (error) {
      console.error('checkout: unhandled error', error)
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      })
    }
  },
}

export default worker
