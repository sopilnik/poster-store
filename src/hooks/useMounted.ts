import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

// Reads whether the component has hydrated on the client, without setting state from an
// effect: the client and server snapshots differ on purpose, so React resolves the mismatch
// during hydration instead of after a mount-triggered render.
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot)
}
