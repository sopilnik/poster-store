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
  email: z.email('Enter a valid email address'),
  fullName: z.string().trim().min(2, 'Enter your full name').max(80, 'Use 80 characters or fewer'),
  address: z.string().trim().min(4, 'Enter your street address').max(120, 'Use 120 characters or fewer'),
  city: z.string().trim().min(2, 'Enter your city').max(80, 'Use 80 characters or fewer'),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{3,12}$/, 'Use 3 to 12 letters, digits, spaces or dashes'),
  country: z.enum(COUNTRIES),
  delivery: z.enum(['standard', 'express']),
  payment: z.literal('demo'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
