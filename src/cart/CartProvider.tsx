'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { cartReducer } from './reducer'
import { loadCart, saveCart } from './storage'
import type { CartContextValue, CartState } from './types'

export const CartContext = createContext<CartContextValue | null>(null)

const initialState: CartState = { items: [] }

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [hydrated, markHydrated] = useReducer(() => true, false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    dispatch({ type: 'replace', items: loadCart() })
    markHydrated()
  }, [])

  useEffect(() => {
    if (hydrated) saveCart(state.items)
  }, [state.items, hydrated])

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      hydrated,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      dispatch,
    }),
    [state.items, hydrated, isOpen]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
