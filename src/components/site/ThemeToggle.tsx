'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, SunMoon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NEXT: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' }

const noopSubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

// Reads whether the component has hydrated on the client, without setting state from an
// effect: the client and server snapshots differ on purpose, so React resolves the mismatch
// during hydration instead of after a mount-triggered render.
function useMounted() {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot)
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  const current = mounted ? (theme ?? 'system') : 'system'
  const Icon = !mounted ? SunMoon : current === 'light' ? Sun : current === 'dark' ? Moon : SunMoon

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch theme, current: ${current}`}
      onClick={() => setTheme(NEXT[current] ?? 'system')}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
