const strip = (u: string) => u.replace(/\/+$/, '')
export const BRAND = 'Formline'
export const REPO_URL = 'https://github.com/sopilnik/poster-store'
export const AUTHOR_NAME = 'Alexandr Sopilnik'
export const CHECKOUT_API = strip(process.env.NEXT_PUBLIC_CHECKOUT_API ?? '')
export function hasCheckoutApi(): boolean { return CHECKOUT_API.length > 0 }
