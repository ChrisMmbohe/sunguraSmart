"use client"

import * as React from "react"
import { formatCurrency, formatCurrencyCompact, DEFAULT_CURRENCY, type FormatCurrencyOptions } from "@/lib/currency"

interface CurrencyContextValue {
  currency: string
  format: (amount: number | null | undefined, options?: FormatCurrencyOptions) => string
  formatCompact: (amount: number | null | undefined) => string
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null)

/**
 * Wrap the app (or at minimum, the authenticated layout) with this once,
 * passing the signed-in user's `currency` field:
 *
 *   // app/(dashboard)/layout.tsx (server component)
 *   const user = await User.findOne({ clerkId: userId }).lean()
 *   return (
 *     <CurrencyProvider currency={user?.currency ?? "KES"}>
 *       {children}
 *     </CurrencyProvider>
 *   )
 *
 * Any client component anywhere below it can then do:
 *   const { format } = useCurrency()
 *   format(record.totalAmount) // "KSh 4,500" — no prop drilling needed
 */
export function CurrencyProvider({
  currency = DEFAULT_CURRENCY,
  children,
}: {
  currency?: string
  children: React.ReactNode
}) {
  const value = React.useMemo<CurrencyContextValue>(
    () => ({
      currency,
      format: (amount, options) => formatCurrency(amount, currency, options),
      formatCompact: (amount) => formatCurrencyCompact(amount, currency),
    }),
    [currency]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

/**
 * Falls back to the app default (KES) with a console warning if used
 * outside a CurrencyProvider, rather than throwing — a missing provider
 * shouldn't take down a whole page over currency formatting.
 */
export function useCurrency(): CurrencyContextValue {
  const ctx = React.useContext(CurrencyContext)
  if (!ctx) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("useCurrency() called outside <CurrencyProvider> — falling back to KES.")
    }
    return {
      currency: DEFAULT_CURRENCY,
      format: (amount, options) => formatCurrency(amount, DEFAULT_CURRENCY, options),
      formatCompact: (amount) => formatCurrencyCompact(amount, DEFAULT_CURRENCY),
    }
  }
  return ctx
}
