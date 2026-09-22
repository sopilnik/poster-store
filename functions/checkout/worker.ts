import Stripe from 'stripe'
import { readEnv, type Env } from './env'
import { handle } from './handler'
import type { StripeLike } from './session'

function makeStripe(key: string): StripeLike {
  const client = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
  const cryptoProvider = Stripe.createSubtleCryptoProvider()

  return {
    checkout: {
      sessions: {
        create: (params, options) => client.checkout.sessions.create(params, options),
        retrieve: id => client.checkout.sessions.retrieve(id),
      },
    },
    webhooks: {
      constructEventAsync: async (payload, signature, secret) => {
        const event = await client.webhooks.constructEventAsync(payload, signature, secret, undefined, cryptoProvider)
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object
          return {
            id: event.id,
            type: event.type,
            data: {
              object: {
                id: session.id,
                metadata: session.metadata,
                payment_status: session.payment_status,
              },
            },
          }
        }
        // Other event types carry a `data.object` without a guaranteed `id`, so only the
        // fields `dispatchEvent` actually reads for a non-completed event are forwarded.
        return {
          id: event.id,
          type: event.type,
          data: { object: { id: event.id } },
        }
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
