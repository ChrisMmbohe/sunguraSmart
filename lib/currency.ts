/**
 * App-wide currency formatting.
 *
 * Every farm has a single `currency` on its User document (default 'KES'),
 * so nearly every amount in the app — sale totals, expense amounts,
 * acquisition costs, dashboard KPIs — should be formatted through here
 * rather than each page inventing its own Intl.NumberFormat call.
 *
 * Usage:
 *   import { formatCurrency } from "@/lib/currency"
 *   formatCurrency(4500, "KES")            -> "KSh 4,500"
 *   formatCurrency(4500.5, "KES")          -> "KSh 4,501" (KES has no minor unit in everyday use)
 *   formatCurrency(1250000, "UGX", { compact: true }) -> "USh 1.3M"
 *
 * For client components deep in the tree, prefer the `useCurrency()` hook
 * from `@/components/providers/currency-provider` so the farm's currency
 * doesn't have to be prop-drilled everywhere — see that file for setup.
 */

export interface CurrencyInfo {
  name: string
  /** Locale used for grouping/decimal separators. */
  locale: string
  /** Symbol used in the compact/manual fallback path. */
  symbol: string
  /** Whether this currency is conventionally shown without decimal places
   *  in everyday bookkeeping (true for every East African shilling/franc). */
  zeroDecimal: boolean
}

/**
 * Curated for East Africa first (EAC + neighboring economies this app's
 * farms are likely to operate in or trade across), plus the handful of
 * international currencies a farm might realistically deal with.
 * Not an exhaustive ISO 4217 list — add more here as needed.
 */
export const SUPPORTED_CURRENCIES = {
  KES: { name: "Kenyan Shilling", locale: "en-KE", symbol: "KSh", zeroDecimal: true },
  UGX: { name: "Ugandan Shilling", locale: "en-UG", symbol: "USh", zeroDecimal: true },
  TZS: { name: "Tanzanian Shilling", locale: "en-TZ", symbol: "TSh", zeroDecimal: true },
  RWF: { name: "Rwandan Franc", locale: "rw-RW", symbol: "FRw", zeroDecimal: true },
  BIF: { name: "Burundian Franc", locale: "fr-BI", symbol: "FBu", zeroDecimal: true },
  SSP: { name: "South Sudanese Pound", locale: "en-SS", symbol: "SSP", zeroDecimal: false },
  ETB: { name: "Ethiopian Birr", locale: "en-ET", symbol: "Br", zeroDecimal: false },
  SOS: { name: "Somali Shilling", locale: "so-SO", symbol: "Sh.So.", zeroDecimal: true },
  DJF: { name: "Djiboutian Franc", locale: "fr-DJ", symbol: "Fdj", zeroDecimal: true },
  USD: { name: "US Dollar", locale: "en-US", symbol: "$", zeroDecimal: false },
  EUR: { name: "Euro", locale: "en-IE", symbol: "€", zeroDecimal: false },
  GBP: { name: "British Pound", locale: "en-GB", symbol: "£", zeroDecimal: false },
} as const satisfies Record<string, CurrencyInfo>

export type SupportedCurrencyCode = keyof typeof SUPPORTED_CURRENCIES

export const DEFAULT_CURRENCY: SupportedCurrencyCode = "KES"

export function isSupportedCurrency(code: string | undefined | null): code is SupportedCurrencyCode {
  return !!code && code in SUPPORTED_CURRENCIES
}

/** Options accepted by every formatter below. */
export interface FormatCurrencyOptions {
  /** "1.3M" instead of "1,300,000" — good for tight dashboard tiles. */
  compact?: boolean
  /** Force decimal places on/off, overriding the currency's zeroDecimal default. */
  forceDecimals?: boolean
  /** Render "KSh 4,500" as "4,500 KES" using the ISO code instead of the symbol. */
  showCodeInstead?: boolean
}

function resolveCurrencyInfo(currency: string): CurrencyInfo {
  if (isSupportedCurrency(currency)) return SUPPORTED_CURRENCIES[currency]
  // Unrecognized code (custom/unlisted currency) — fall back to a neutral
  // formatter rather than throwing, so a bad/missing User.currency value
  // never crashes a page.
  return { name: currency, locale: "en-US", symbol: currency, zeroDecimal: false }
}

/**
 * The main formatter. Currency code should come from the signed-in user's
 * `currency` field (default 'KES') — pass it explicitly rather than
 * hardcoding a currency in page/component code.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options: FormatCurrencyOptions = {}
): string {
  const value = amount ?? 0
  const info = resolveCurrencyInfo(currency)
  const useDecimals = options.forceDecimals ?? !info.zeroDecimal

  try {
    const formatted = new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: isSupportedCurrency(currency) ? currency : "USD", // Intl needs a valid ISO code even if we relabel it below
      currencyDisplay: options.showCodeInstead ? "code" : "symbol",
      notation: options.compact ? "compact" : "standard",
      maximumFractionDigits: useDecimals ? 2 : 0,
      minimumFractionDigits: options.compact ? 0 : useDecimals ? 2 : 0,
    }).format(value)

    // Intl has no concept of e.g. "KSh" — it renders KES via currencyDisplay
    // as "KES" (code) or a locale-guessed symbol that's sometimes wrong
    // (e.g. "KSh" isn't guaranteed). Swap in our curated symbol for the
    // common case so amounts read the way Kenyan/Ugandan/etc. users expect.
    if (!options.showCodeInstead && isSupportedCurrency(currency)) {
      return formatted.replace(/^[A-Za-z.]+\s?/, `${info.symbol} `).trim()
    }
    return formatted
  } catch {
    // Extremely defensive fallback if Intl throws for any reason.
    const rounded = useDecimals ? value.toFixed(2) : Math.round(value).toString()
    return `${info.symbol} ${rounded}`
  }
}

/** Shorthand for dashboard tiles / chart axes: "KSh 1.3M" instead of "KSh 1,300,000". */
export function formatCurrencyCompact(amount: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  return formatCurrency(amount, currency, { compact: true })
}

/**
 * Strips grouping separators and currency symbols from a user-typed
 * amount (e.g. a paste from a receipt) so it can be coerced to a number
 * for form submission. Returns NaN for genuinely unparseable input —
 * callers should treat that as a validation failure, not silently 0 it.
 */
export function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, "")
  if (cleaned === "" || cleaned === "-") return NaN
  return Number(cleaned)
}

export function currencyLabel(currency: string): string {
  return resolveCurrencyInfo(currency).name
}
