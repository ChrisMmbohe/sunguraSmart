/** Thrown when a document/reference is accessed by a user who doesn't own it. */
export class OwnershipError extends Error {
  constructor(message = 'You do not have access to this resource.') {
    super(message);
    this.name = 'OwnershipError';
  }
}

/**
 * Guards against cross-tenant data leaks — e.g. assigning a Cage that
 * belongs to Farm A onto a Rabbit that belongs to Farm B. Call this in
 * pre-save hooks whenever one tenant document references another.
 */
export function assertOwnedByUser(
  doc: { userId: string } | null | undefined,
  userId: string,
  resourceName = 'Resource'
): void {
  if (!doc) {
    throw new OwnershipError(`${resourceName} not found.`);
  }
  if (doc.userId !== userId) {
    throw new OwnershipError(`${resourceName} does not belong to this farm.`);
  }
}

/** Rounds to 2 decimal places — use for all currency and weight-in-kg fields. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Clamps a number so it can never be persisted as negative (stock, counts, balances). */
export function nonNegative(value: number): number {
  return Math.max(0, value);
}

/** Adds `days` to a date and returns a new Date, used for due-date / follow-up automation. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Whole days between two dates (floor), used for age-in-days calculations. */
export function daysBetween(start: Date, end: Date = new Date()): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}
