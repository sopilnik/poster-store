'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

export function ThemeProvider({ children }: { children: ComponentProps<'div'>['children'] }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
