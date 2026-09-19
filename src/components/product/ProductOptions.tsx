'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Minus, Plus, Check } from 'lucide-react'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'
import { useCart } from '@/cart/CartProvider'
import { MAX_QTY } from '@/cart/reducer'
import { PALETTES } from '@/catalog/palettes'
import { SIZES } from '@/catalog/sizes'
import { variantPriceCents } from '@/catalog/pricing'
import { formatCents } from '@/lib/money'
import type { Product, SizeId } from '@/catalog/types'
import type { PaletteId } from '@/posters/types'
import { PosterFrame } from './PosterFrame'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function clampQty(qty: number): number {
  return Math.min(MAX_QTY, Math.max(1, qty))
}

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
        className="mx-auto w-full max-w-[calc(38vh*1000/1414)] md:col-span-5 md:max-w-[calc(70vh*1000/1414)]"
      />

      <div className="flex flex-col gap-6 md:col-span-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
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
                    className="relative flex size-7 items-center justify-center rounded-full border border-border outline-none ring-primary ring-offset-2 ring-offset-background data-checked:ring-2 focus-visible:ring-2"
                    style={{ backgroundColor: p.background }}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
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
            <SelectContent>
              {sizeItems.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty(q => clampQty(q - 1))}
          >
            <Minus aria-hidden="true" />
          </Button>
          <span>{qty}</span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Increase quantity"
            disabled={qty >= MAX_QTY}
            onClick={() => setQty(q => clampQty(q + 1))}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>

        <Button onClick={handleAdd}>Add to cart</Button>
      </div>
    </div>
  )
}
