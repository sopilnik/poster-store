# Formline

![CI](https://github.com/sopilnik/poster-store/actions/workflows/ci.yml/badge.svg)

**Live demo:** [formline.sopilnik.dev](https://formline.sopilnik.dev)

A demo poster store built as a static Next.js export. Orders are not real and nothing is charged.

![Home page](.github/media/home.png)
![Product page](.github/media/product.png)
![Shop filtered by collection](.github/media/shop.png)

## What this is

A demo storefront and a work sample: sixteen posters across four collections, six palettes, a cart,
and a checkout flow that ends in a fake order. Nothing here ships a real product or takes a real
payment.

## Stack

Next.js static export, TypeScript, React, Tailwind CSS 4 with CSS custom-property design tokens in
app/globals.css, Base UI primitives adapted with shadcn/ui conventions. Posters and OG images are
generated at build time from SVG templates and rendered to PNG with resvg. Vitest for unit tests,
Playwright for the end-to-end suite.

## Run it

Requirements: Node 26 or newer (`.nvmrc` pins 26, `engines.node` requires it) and pnpm 11
(`packageManager` pins 11.26.0). Node 25 and later no longer bundle Corepack, so run
`npm install -g corepack` and then `corepack enable`, or install pnpm 11 directly. `engine-strict`
in `.npmrc` aborts the install below the floor instead of only warning.

Copy `.env.example` to `.env.local` before a real build. `SITE_URL` becomes `metadataBase` and every
canonical, OG and sitemap url; `AUTHOR_URL` is the footer author link.

### Development

```bash
pnpm install
pnpm dev
```

### Static build and preview

```bash
pnpm build && pnpm preview
```

Served on port 4321. `pnpm render` writes the posters into `public/posters` and `public/og`; they are
not in the tree.

## Tests

```bash
pnpm test
pnpm test:coverage
pnpm test:e2e
```

`pnpm test:e2e` builds the export first, so it always runs against the current code. Run
`pnpm exec playwright install chromium` once before the first `pnpm test:e2e`.

```bash
UPDATE_GOLDEN=1 pnpm test src/posters/rasterize.test.ts
```

Regenerates the golden poster PNG after an intended change to the rasteriser or a template.

Lighthouse, against `pnpm preview`:

```bash
pnpm dlx lighthouse@13 http://localhost:4321/ --preset=desktop --chrome-flags="--headless"
```

## How it is built

Poster templates are inline SVG, rendered to PNG at build time. The site is a fully static export — no
middleware, no server actions. Shop filters are written into the URL with `history.replaceState` and
read back from `location.search` on mount and on `popstate`, in `src/components/shop/ShopClient.tsx`.
The cart and a placed order are held in browser storage, read and written through small typed helpers.

### Layout

- `app/` — Next.js App Router routes, layouts and the sitemap/robots generators.
- `src/catalog` — product, collection, palette, size and pricing data, plus the shop query
  parsing, filtering and sorting (`query.ts`).
- `src/posters` — poster templates and the SVG-to-PNG rasteriser.
- `src/cart` — cart state, storage and totals.
- `src/checkout` — checkout order schema, limits and storage.
- `src/components` — UI components, including the shop client and the adapted shadcn/ui primitives.
- `functions/checkout` — the Cloudflare Worker that runs Stripe Checkout outside the static export.
- `scripts/` — poster rendering, the local preview server and the bunny deploy script.
- `tests/e2e` — the Playwright end-to-end specs.

## Card payments

Checkout always offers a demo payment that takes no card details. When a checkout API is
configured through `NEXT_PUBLIC_CHECKOUT_API`, a second option opens a real Stripe Checkout
session in test mode, using Stripe's own test card. That function is not part of the static
export — it lives in [`functions/checkout/`](functions/checkout/README.md), with its own README
covering how to run it locally and what deploying it needs.

## Deployment

CI (`.github/workflows/ci.yml`) builds and tests on every push, then deploys the static export and the
checkout function as two separate jobs on `main`. Nothing here holds a value — only the names of the
repository variables and secrets that switch each job on and what each one controls.

Repository variables:

- `SITE_URL` — the canonical origin baked into the static export and passed to the checkout function;
  both deploy jobs run only when it is set.
- `AUTHOR_URL` — the footer author link baked into the static export.
- `NEXT_PUBLIC_CHECKOUT_API` — the checkout function's origin; unset, the storefront offers only the
  demo payment.
- `CHECKOUT_WORKER_NAME` — the stage switch for the checkout function: the deploy-function job runs
  only when this is set (together with `SITE_URL`), so the function stays undeployed while the store
  runs static-only.
- `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_HOST`, `BUNNY_PULL_ZONE_ID` — the bunny.net storage zone and
  pull zone the static export is deployed and purged to.

Repository secrets (names only, never their values):

- `BUNNY_STORAGE_PASSWORD`, `BUNNY_API_KEY` — used by the static-site deploy job.
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — used by the deploy-function job, which checks both
  are present and fails, naming the first one missing, before it deploys. The Worker's own Stripe
  secrets are set directly on Cloudflare (`wrangler secret put`), not held in GitHub.

### Deployment headers

The bunny pull zone carries one edge rule, "Security response headers", matching every request with
seven **Set Response Header** actions:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://formline-api.sopilnik.dev; frame-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
X-Robots-Tag: noindex
```

`connect-src` gains the checkout function's origin once card payments are enabled
(`NEXT_PUBLIC_CHECKOUT_API` set). `X-Robots-Tag: noindex` is deliberate: this is a demo storefront and
stays out of Google and Yandex. `scripts/serve.mjs` serves the same set, minus
`Strict-Transport-Security` and the CSP's `upgrade-insecure-requests` directive — both only mean
something over https — so `tests/e2e/headers.spec.ts` can check the policy end to end.

## License

MIT for the store's own code, see [LICENSE](LICENSE). `src/components/ui/` is adapted from
shadcn/ui (MIT). Base UI (MIT). lucide-react (ISC). Inter and Space Grotesk are licensed under the
SIL Open Font License 1.1, with their license files kept beside them at `src/fonts/LICENSE.txt` and
`src/fonts/SpaceGrotesk-OFL.txt`.

Security policy: see [SECURITY.md](SECURITY.md).
