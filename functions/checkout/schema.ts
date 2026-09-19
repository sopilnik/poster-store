import { z } from 'zod'

const lineItemSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  qty: z.number().int().min(1).max(10),
})

export const checkoutSessionSchema = z.object({
  orderId: z.string().regex(/^FL-[A-Z0-9]{6}$/, 'Enter a well-formed order id'),
  items: z.array(lineItemSchema).min(1).max(20),
  delivery: z.enum(['standard', 'express']),
  email: z.email().optional(),
})

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>
