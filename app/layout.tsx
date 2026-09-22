import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { CartProvider } from '@/cart/CartProvider'
import { CartSheet } from '@/components/cart/CartSheet'
import { ThemeProvider } from '@/components/site/ThemeProvider'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { Toaster } from '@/components/ui/sonner'
import { BRAND, SITE_URL } from '@/lib/site'
import './globals.css'

const inter = localFont({
  src: '../src/fonts/InterVariable-latin.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
})

const spaceGrotesk = localFont({
  src: [
    { path: '../src/fonts/SpaceGrotesk-Regular-latin.woff2', weight: '400', style: 'normal' },
    { path: '../src/fonts/SpaceGrotesk-Bold-latin.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: BRAND, template: `%s · ${BRAND}` },
  description: 'Posters made of geometry and type. A demo store.',
  openGraph: { images: ['/og/default.png'] },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider>
          <CartProvider>
            <a
              href="#main"
              className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-foreground focus-visible:shadow"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" tabIndex={-1} className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster />
            <CartSheet />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
