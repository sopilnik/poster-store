'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { MAX_QTY } from '@/cart/reducer'

const MIN_QTY = 1

function clamp(qty: number): number {
  return Math.min(MAX_QTY, Math.max(MIN_QTY, qty))
}

export function QuantityStepper({
  value,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
  className,
}: {
  value: number
  onChange: (qty: number) => void
  label: string
  decreaseLabel: string
  increaseLabel: string
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)

  function reset() {
    setDraft(null)
  }

  function step(delta: number) {
    onChange(clamp(value + delta))
    reset()
  }

  function handleChange(raw: string) {
    if (!/^\d*$/.test(raw)) return
    const n = Number(raw)
    if (raw === '' || n === 0) {
      setDraft(raw)
      return
    }
    if (n > MAX_QTY) {
      setDraft(String(MAX_QTY))
      onChange(MAX_QTY)
      return
    }
    setDraft(String(n))
    onChange(n)
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant="outline"
        size="icon-sm"
        className="relative after:absolute after:-inset-2"
        aria-label={decreaseLabel}
        disabled={value <= MIN_QTY}
        onClick={() => step(-1)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <label className="flex -my-2 -mx-1 py-2 px-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={label}
          className="h-7 w-10 rounded-[min(var(--radius-md),12px)] border border-input bg-background px-1 text-center text-base tabular-nums outline-none cursor-text focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring md:text-sm dark:bg-input/30"
          value={draft ?? String(value)}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              step(1)
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              step(-1)
            } else if (e.key === 'Enter') {
              reset()
            }
          }}
          onBlur={reset}
        />
      </label>
      <Button
        variant="outline"
        size="icon-sm"
        className="relative after:absolute after:-inset-2"
        aria-label={increaseLabel}
        disabled={value >= MAX_QTY}
        onClick={() => step(1)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}
