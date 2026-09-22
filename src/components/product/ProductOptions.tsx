'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'
import { useCart } from '@/cart/CartProvider'
import { PALETTES } from '@/catalog/palettes'
import { SIZES } from '@/catalog/sizes'
import { variantPriceCents } from '@/catalog/pricing'
import { formatCents } from '@/lib/money'
import type { Product, SizeId } from '@/catalog/types'
import type { PaletteId } from '@/posters/types'
import { PosterFrame } from './PosterFrame'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuantityStepper } from '@/components/QuantityStepper'

export function ProductOptions({ product }: { product: Product }) {
  const { dispatch, open } = useCart()
  const [paletteId, setPaletteId] = useState<PaletteId>(product.palettes[0] ?? 'paper')
  const [sizeId, setSizeId] = useState<SizeId>('a3')
  const [qty, setQty] = useState(1)

  const palette = PALETTES[paletteId]
  const size = SIZES.find(s => s.id === sizeId) ?? SIZES[0]!
  const lineCents = variantPriceCents(product, sizeId) * qty

  const sizeItems = SIZES.map(s => ({
    label: `${s.label} · ${s.cm} · ${formatCents(variantPriceCents(product, s.id))}`,
    value: s.id,
  }))

  function handleAdd() {
    dispatch({ type: 'add', variant: { productSlug: product.slug, sizeId, paletteId }, qty })
    toast(`Added ${product.name} (${size.label}, ${palette.name})`, {
      action: { label: 'Open cart', onClick: open },
    })
  }

  return (
    <div className="grid gap-8 md:grid-cols-12">
      <PosterFrame
        spec={product}
        palette={palette}
        label={`${product.name} preview in ${palette.name}`}
        className="w-full max-w-[calc(38vh*1000/1414)] md:col-span-5 md:max-w-[calc(70vh*1000/1414)]"
      />

      <div className="flex flex-col gap-6 md:col-span-7">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{product.name}</h1>
          <p aria-live="polite" className="mt-1 text-xl font-medium">
            {formatCents(lineCents)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Palette</span>
          <RadioGroup
            aria-label="Palette"
            value={paletteId}
            onValueChange={value => setPaletteId(value as PaletteId)}
            className="flex flex-wrap gap-4"
          >
            {product.palettes.map(id => {
              const p = PALETTES[id]
              return (
                <label key={id} className="flex items-center gap-2 font-normal">
                  <Radio.Root
                    value={id}
                    className="group relative flex size-7 items-center justify-center rounded-full border border-input outline-none ring-primary ring-offset-2 ring-offset-background after:absolute after:-inset-2 data-checked:ring-2 focus-visible:ring-2"
                    style={{ backgroundColor: p.background }}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full group-data-checked:hidden"
                      style={{ backgroundColor: p.ink }}
                    />
                    <Radio.Indicator className="absolute inset-0 flex items-center justify-center">
                      <Check aria-hidden="true" className="size-3.5" style={{ color: p.ink }} />
                    </Radio.Indicator>
                  </Radio.Root>
                  {p.name}
                </label>
              )
            })}
          </RadioGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Select
            items={sizeItems}
            value={sizeId}
            onValueChange={value => {
              if (typeof value === 'string') setSizeId(value as SizeId)
            }}
          >
            <SelectTrigger aria-label="Size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-(--anchor-width)">
              {SIZES.map(s => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  aria-label={`${s.label} · ${s.cm} · ${formatCents(variantPriceCents(product, s.id))}`}
                >
                  <div className="grid w-full grid-cols-[2.5rem_1fr_4.5rem] items-center gap-2">
                    <span>{s.label}</span>
                    <span>{s.cm}</span>
                    <span className="text-right tabular-nums">
                      {formatCents(variantPriceCents(product, s.id))}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <QuantityStepper
          value={qty}
          onChange={setQty}
          label="Quantity"
          decreaseLabel="Decrease quantity"
          increaseLabel="Increase quantity"
        />

        <Button size="lg" className="w-full md:max-w-56" onClick={handleAdd}>
          Add to cart
        </Button>
      </div>
    </div>
  )
}
