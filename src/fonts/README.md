# Fonts

Sources (checked in, kept for provenance and licence attribution):

- `SpaceGrotesk-Regular.ttf`, `SpaceGrotesk-Bold.ttf` — read at build time by `resvg` when rasterizing poster
  artwork (`src/posters/rasterize.ts`); resvg needs the TTF, not the browser subset.
- `SpaceGrotesk-OFL.txt` — Space Grotesk's licence.
- `LICENSE.txt` — Inter's licence.

Derived, served to the browser:

- `InterVariable-latin.woff2` — Latin subset of Inter, version 4.001 (git-9221beed3), variable weight axis kept.
- `SpaceGrotesk-Regular-latin.woff2`, `SpaceGrotesk-Bold-latin.woff2` — Latin subset of the two static weights above.

Regenerate with `pyftsubset`, `flavor=woff2`, `--layout-features='*'`, unicode ranges:

```
U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD
```

Example:

```
pyftsubset src/fonts/InterVariable.ttf --output-file=src/fonts/InterVariable-latin.woff2 \
  --flavor=woff2 --layout-features='*' --unicodes="<the range above>"
```

The Inter source TTF is not kept in the tree (it is only ever needed to regenerate the subset); pull a fresh copy
from the upstream Inter release when a regeneration is needed.

Only Regular (400) and Bold (700) faces of Space Grotesk are shipped. Two headings that asked for an
in-between weight (`Print details` on the product page, the card title) were changed to `font-bold` and
`font-normal` respectively so the requested weight matches a face that is actually shipped, instead of
silently falling back to 400 or 700 under the browser's font-matching rules.
