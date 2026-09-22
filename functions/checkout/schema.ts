import { z } from 'zod'
import { MAX_CART_LINES } from '../../src/checkout/limits'
import { MAX_QTY, MIN_QTY } from '../../src/cart/reducer'

const lineItemSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  qty: z.number().int().min(MIN_QTY).max(MAX_QTY),
})

export const checkoutSessionSchema = z.object({
  orderId: z.string().regex(/^FL-[A-Z0-9]{6}$/, 'Enter a well-formed order id'),
  items: z.array(lineItemSchema).min(1).max(MAX_CART_LINES),
  delivery: z.enum(['standard', 'express']),
  email: z.email().optional(),
})

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>
