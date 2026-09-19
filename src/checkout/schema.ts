import { z } from 'zod'

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Spain',
  'Italy',
  'Poland',
  'Sweden',
  'Canada',
  'Australia',
  'Kazakhstan',
  'Other',
] as const

export const checkoutSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4).max(120),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,12}$/),
  country: z.enum(COUNTRIES),
  delivery: z.enum(['standard', 'express']),
  payment: z.literal('demo'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
