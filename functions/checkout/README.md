# Checkout function

A small serverless function that turns a cart into a Stripe Checkout session, in test mode. It runs
on Cloudflare Workers and is written as a plain Web-standard `fetch` handler, so another host would
need only a new entry file next to `worker.ts`.

## What it does

- `POST /checkout/session` re-prices the cart from the store's own catalog (never trusts an amount
  sent by the browser), builds a Stripe Checkout session with an idempotency key, and returns its url.
- `GET /checkout/session?id=` looks up a session and returns only its status and total, no address or
  email.
- `POST /stripe/webhook` verifies the `stripe-signature` header and logs a completed checkout. There is
  no database behind this demo, so the log line is where a real integration would start fulfilment.

Prices, shipping and the idempotency key are computed on the server from the same catalog modules the
storefront pages use, so a tampered request cannot change what Stripe charges.

## Running it locally

```bash
pnpm install
pnpm functions:dev
```

Create a `.dev.vars` file next to `wrangler.toml` with your own test-mode `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET` before running the command above; it is git-ignored and must never be
committed.

`wrangler dev` reads `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from `.dev.vars`; `SITE_URL` comes
from `wrangler.toml`. Point the store at it with `NEXT_PUBLIC_CHECKOUT_API=http://127.0.0.1:8787 pnpm build`.

To forward Stripe's webhooks to the local function, use the Stripe CLI:

```bash
stripe listen --forward-to http://127.0.0.1:8787/stripe/webhook
```

## Deploying

Secrets are set once, outside any file the repository tracks:

```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

Then `wrangler deploy`. Point it at the production site first — `wrangler deploy --var SITE_URL:https://your-domain`,
or a per-environment `vars` entry in `wrangler.toml` — otherwise the worker keeps sending buyers back to
`http://localhost:4321` and leaves product images out of the checkout session. In CI, deployment is a separate job
gated on the `main` branch and on the four secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) being present.

## What a production shop adds

This is a demo: one event is logged and nothing is stored. A real shop behind this function would add
an order database written from the webhook (not from the browser redirect, which can be skipped or
replayed), receipt emails, refund handling, live keys behind their own review process, and rate
limiting in front of both routes.
