# Checkout function

A small serverless function that turns a cart into a Stripe Checkout session, in test mode. It runs
on Cloudflare Workers and is written as a plain Web-standard `fetch` handler, so another host would
need only a new entry file next to `worker.ts`.

## What it does

- `POST /checkout/session` re-prices the cart from the store's own catalog (never trusts an amount
  sent by the browser), builds a Stripe Checkout session with an idempotency key, and returns its url.
  The request body is capped at 8 KB.
- `GET /checkout/session?id=` looks up a session and returns only its status and total, no address or
  email.
- `POST /stripe/webhook` verifies the `stripe-signature` header and logs a completed checkout. The
  request body is capped at 64 KB. There is no database behind this demo, so the log line is where a
  real integration would start fulfilment.

The three routes are matched exactly at the root of the Worker's origin (a trailing slash is tolerated,
anything else is a 404), so the store's `NEXT_PUBLIC_CHECKOUT_API` must be an origin without a path.

Prices, shipping and the idempotency key are computed on the server from the same catalog modules the
storefront pages use, so a tampered request cannot change what Stripe charges.

## Running it locally

```bash
pnpm install
pnpm functions:dev
```

Create a `.dev.vars` file next to `wrangler.toml` with your own test-mode `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET` and a `SITE_URL` (for example `http://localhost:4321`) before running the
command above; it is git-ignored and must never be committed. The function refuses anything but a
test-mode key (`rk_test_` or `sk_test_`).

`wrangler dev` reads `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SITE_URL` from `.dev.vars`; there
is no fallback, so a missing value fails fast instead of silently pointing at localhost. Point the store
at it with `NEXT_PUBLIC_CHECKOUT_API=http://127.0.0.1:8787 pnpm build`.

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
gated on the `main` branch and on the `CHECKOUT_WORKER_NAME` and `SITE_URL` repository variables being set; once
that gate opens, the job itself checks the two Cloudflare secrets (`CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`) and fails loudly, naming the first one missing, before it tries to deploy; the Stripe
secrets stay on Cloudflare (set above with `wrangler secret put`) and are never held in GitHub.

## What a production shop adds

This is a demo: one event is logged and nothing is stored. A real shop behind this function would add
an order database written from the webhook (not from the browser redirect, which can be skipped or
replayed), receipt emails, refund handling, and live keys behind their own review process.

## Abuse limits

Request bodies are capped in code (8 KB on `/checkout/session`, 64 KB on `/stripe/webhook`, see "What
it does" above). Request rate is limited by one Cloudflare rate-limiting rule on `/checkout/session`,
set in the dashboard — an owner step; the exact numbers depend on the plan's rule form. `/stripe/webhook`
is never rate-limited, because Stripe retries from many addresses.
