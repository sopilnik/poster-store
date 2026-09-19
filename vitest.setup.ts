/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest'

// next.config.ts sets trailingSlash: true; next/link reads this flag from an env var that the
// Next build normally injects, so component tests need it set to render the same hrefs the
// static export produces.
process.env.__NEXT_TRAILING_SLASH = '1'

if (typeof window !== 'undefined') {
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  }

  if (typeof window.ResizeObserver === 'undefined') {
    class NoopResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver
  }
}
