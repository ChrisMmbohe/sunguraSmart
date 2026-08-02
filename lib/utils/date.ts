/**
 * Shared date formatter for table cells and anywhere else a date needs to
 * render as text.
 *
 * IMPORTANT: Never call `.toLocaleDateString(undefined, ...)` directly in a
 * Client Component that's also server-rendered. Passing `undefined` as the
 * locale defers to the runtime's default locale — which is the *server's*
 * locale during SSR and the *browser's* locale during hydration. Those can
 * differ (e.g. Node defaulting to en-US ordering "Jul 3, 2026" vs a browser
 * on en-GB producing "3 Jul 2026"), which throws a hydration mismatch even
 * though the underlying Date is identical.
 *
 * Fix: always pass an explicit, fixed locale. "en-KE" is used app-wide here
 * to match the currency formatting already used on the dashboard
 * (`Intl.NumberFormat("en-KE", ...)`), so date and currency conventions stay
 * consistent for this Kenyan-market SaaS product regardless of who's viewing.
 */

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats an ISO string or Date as e.g. "3 Jul 2026". Returns "—" for null/undefined. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

/** Formats an ISO string or Date with a time component, e.g. "3 Jul 2026, 14:30". */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFormatter.format(d);
}
