const strip = (u: string) => u.replace(/\/+$/, '')
export const BRAND = 'Formline'
export const SITE_URL = strip(process.env.SITE_URL || 'http://localhost:4321')
export const AUTHOR_URL = strip(process.env.AUTHOR_URL || 'https://github.com/sopilnik')
export const REPO_URL = 'https://github.com/sopilnik/poster-store'
export const AUTHOR_NAME = 'Alexandr Sopilnik'
export const CHECKOUT_API = strip(process.env.NEXT_PUBLIC_CHECKOUT_API ?? '')
export function hasCheckoutApi(): boolean { return CHECKOUT_API.length > 0 }
export function absoluteUrl(path: string): string { return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` }
