'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Monitor, Sun } from 'lucide-react'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
] as const

const noopSubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

// Reads whether the component has hydrated on the client, without setting state from an
// effect: the client and server snapshots differ on purpose, so React resolves the mismatch
// during hydration instead of after a mount-triggered render.
function useMounted() {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot)
}

const segmentClass =
  'flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none data-checked:bg-primary data-checked:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <div aria-hidden="true" className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
        {OPTIONS.map(({ value, Icon }) => (
          <span key={value} className="flex size-8 items-center justify-center text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
        ))}
      </div>
    )
  }

  return (
    <RadioGroup
      aria-label="Theme"
      value={theme ?? 'system'}
      onValueChange={value => setTheme(value as string)}
      className="flex w-fit items-center gap-0.5 rounded-md border border-border p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <Radio.Root key={value} value={value} className={segmentClass}>
          <Icon aria-hidden="true" className="size-4" />
          <span className="sr-only">{label}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}
