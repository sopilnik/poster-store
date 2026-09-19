# Formline

A demo poster store built as a static Next.js export. Orders are not real and nothing is charged.

![Home page](.github/media/home.png)
![Product page](.github/media/product.png)
![Shop filtered by collection](.github/media/shop.png)

## What this is

A demo storefront and a work sample: sixteen posters, four palettes, a cart, and a checkout flow that
ends in a fake order. Nothing here ships a real product or takes a real payment.

## Stack

Next.js static export, TypeScript, React, Base UI primitives adapted with shadcn/ui conventions, plain
CSS with design tokens. Posters and OG images are generated at build time from SVG templates and
rendered to PNG with resvg. Vitest for unit tests, Playwright for the end-to-end suite.

## Run it

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
pnpm test:e2e
```

Lighthouse, against `pnpm preview`:

```bash
npx lighthouse http://localhost:4321/ --preset=desktop --chrome-flags="--headless=new"
```

## How it is built

Poster templates are inline SVG, rendered to PNG at build time. The site is a fully static export — no
middleware, no server actions, no `useSearchParams`; shop filters live in the URL through the router
instead. The cart and a placed order are held in browser storage, read and written through small typed
helpers.

## Licence

MIT for the store's own code, see `LICENSE`. `src/components/ui/` is adapted from shadcn/ui (MIT).
Base UI (MIT). lucide-react (ISC). Inter and Space Grotesk are licensed under the SIL Open Font
License 1.1, with their licence files kept beside them at `src/fonts/LICENSE.txt` and
`public/fonts/OFL.txt`.
