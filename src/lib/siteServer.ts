const strip = (u: string) => u.replace(/\/+$/, '')
export const SITE_URL = strip(process.env.SITE_URL || 'http://localhost:4321')
export const AUTHOR_URL = strip(process.env.AUTHOR_URL || 'https://github.com/sopilnik')
export function absoluteUrl(path: string): string { return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` }
