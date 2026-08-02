/**
 * One-off reconciliation script for the Sale-hook cage-sync bug.
 *
 * Background: `Sale_model.ts`'s post-save hook used to release sold
 * rabbits via `Rabbit.updateMany(...)`, which bypasses the Rabbit
 * document's `save()` post-hook that normally syncs the rabbit's cage
 * back to `status: 'empty'` / `currentRabbit: null`. Any farm that sold
 * a caged rabbit before that fix may have `Cage` documents stuck at
 * `status: 'occupied'` pointing at a rabbit that's no longer there
 * (sold, or since moved to a different cage).
 *
 * This script re-derives the correct state for every Cage document
 * directly from the Rabbit collection (the actual source of truth) and
 * corrects any drift:
 *
 *   1. If `cage.currentRabbit` is set but that rabbit is no longer
 *      ACTIVE, or is active but no longer points at this cage — clear
 *      `currentRabbit`. This runs regardless of `status`, so it won't
 *      clobber a cage that's deliberately in `maintenance`/`reserved`/
 *      etc., it just stops it from also claiming a phantom occupant.
 *   2. If, after step 1, `status === OCCUPIED` but there is no valid
 *      occupant — set `status: EMPTY`.
 *   3. If there IS a valid ACTIVE rabbit currently pointing at this
 *      cage but the cage doc doesn't reflect it — set
 *      `status: OCCUPIED` and `currentRabbit` to that rabbit.
 *
 * Cages in any other status (maintenance, reserved, etc.) are left in
 * that status; only `currentRabbit` drift is corrected for them.
 *
 * IMPORTANT: This is a plain Node/tsx script, not a Next.js server
 * context, so it deliberately does NOT import `database/connection.ts`
 * or the `@/database` barrel (both are marked `import 'server-only'`
 * and will throw outside Next's server compiler). It connects to Mongo
 * itself and imports model files directly.
 *
 * Setup: make sure MONGODB_URI is available in the environment. If you
 * keep it in .env.local (the Next.js convention), this script will load
 * that file automatically — no extra dependency required.
 *
 * Usage (run from the project root):
 *   npx tsx scripts/reconcile-cage-occupancy.ts            # dry run, prints a report
 *   npx tsx scripts/reconcile-cage-occupancy.ts --apply    # actually writes the fixes
 *   npx tsx scripts/reconcile-cage-occupancy.ts --apply --user=<clerkUserId>   # scope to one tenant
 *
 * Safe to re-run — running it again after --apply should report zero
 * cages needing changes.
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose, { Types } from 'mongoose';

// ---------------------------------------------------------------------
// Minimal .env.local / .env loader (no `dotenv` dependency required).
// Next.js loads these automatically for the app itself; a standalone
// script needs to do it manually.
// ---------------------------------------------------------------------
function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

// ---------------------------------------------------------------------
// Direct model imports — NOT the @/database barrel (server-only guarded).
// Adjust these relative paths if your project structure differs.
// ---------------------------------------------------------------------
import { Cage } from '../database/models/Cage_model';
import { Rabbit } from '../database/models/Rabbit_model';
import { RabbitStatus, CageStatus } from '../types/enums';

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Missing MONGODB_URI. Set it in the environment or in .env.local at the project root.'
    );
  }
  await mongoose.connect(uri, { bufferCommands: false });
}

interface PlannedFix {
  cageId: string;
  userId: string;
  label: string;
  before: { status: string; currentRabbit: string | null };
  after: { status: string; currentRabbit: string | null };
  reason: string;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const userArg = args.find((a) => a.startsWith('--user='));
  const userIdFilter = userArg ? userArg.split('=')[1] : undefined;

  await connect();

  const cageFilter: Record<string, unknown> = {};
  if (userIdFilter) cageFilter.userId = userIdFilter;

  const cages = await Cage.find(cageFilter).lean();

  // Build, per tenant, a map of cageId -> the ACTIVE rabbit(s) that
  // currently claim it. (Today's model is single-occupant-per-cage via
  // `Rabbit.cage`; if a farm somehow has more than one active rabbit
  // pointing at the same cage, that's flagged below rather than silently
  // picking one.)
  const rabbitFilter: Record<string, unknown> = { status: RabbitStatus.ACTIVE, cage: { $ne: null } };
  if (userIdFilter) rabbitFilter.userId = userIdFilter;

  const activeCagedRabbits = await Rabbit.find(rabbitFilter, { userId: 1, cage: 1 }).lean();

  const occupantsByCage = new Map<string, { rabbitId: string; userId: string }[]>();
  for (const r of activeCagedRabbits) {
    const key = String(r.cage);
    const list = occupantsByCage.get(key) ?? [];
    list.push({ rabbitId: String(r._id), userId: r.userId });
    occupantsByCage.set(key, list);
  }

  const fixes: PlannedFix[] = [];
  const conflicts: { cageId: string; label: string; occupantCount: number }[] = [];

  for (const cage of cages) {
    const cageId = String(cage._id);
    const occupants = occupantsByCage.get(cageId)?.filter((o) => o.userId === cage.userId) ?? [];

    if (occupants.length > 1) {
      // More than one active rabbit claims this single-occupant cage.
      // Don't guess — surface it for manual review instead of silently
      // picking a winner.
      conflicts.push({ cageId, label: cage.label, occupantCount: occupants.length });
      continue;
    }

    const trueOccupantId = occupants[0]?.rabbitId ?? null;
    const currentRabbitId = cage.currentRabbit ? String(cage.currentRabbit) : null;

    let nextCurrentRabbit = currentRabbitId;
    let nextStatus = cage.status as string;
    let reason = '';

    // Step 1: clear a stale currentRabbit pointer (points at a rabbit
    // that's no longer active in this cage), independent of status.
    if (currentRabbitId && currentRabbitId !== trueOccupantId) {
      nextCurrentRabbit = null;
      reason = 'cleared stale currentRabbit (rabbit sold/moved/deceased)';
    }

    // Step 2: an OCCUPIED cage with no valid occupant goes to EMPTY.
    if (nextStatus === CageStatus.OCCUPIED && !trueOccupantId) {
      nextStatus = CageStatus.EMPTY;
      reason = reason ? `${reason}; status OCCUPIED -> EMPTY (no occupant)` : 'status OCCUPIED -> EMPTY (no occupant)';
    }

    // Step 3: a valid active occupant exists but the cage doesn't
    // reflect it yet.
    if (trueOccupantId && (nextCurrentRabbit !== trueOccupantId || nextStatus !== CageStatus.OCCUPIED)) {
      nextCurrentRabbit = trueOccupantId;
      nextStatus = CageStatus.OCCUPIED;
      reason = reason
        ? `${reason}; synced to actual occupant`
        : 'synced to actual occupant (was not marked occupied)';
    }

    const changed = nextStatus !== cage.status || nextCurrentRabbit !== currentRabbitId;
    if (!changed) continue;

    fixes.push({
      cageId,
      userId: cage.userId,
      label: cage.label,
      before: { status: cage.status, currentRabbit: currentRabbitId },
      after: { status: nextStatus, currentRabbit: nextCurrentRabbit },
      reason,
    });
  }

  // ---- Report ----
  console.log(`Scanned ${cages.length} cage(s)${userIdFilter ? ` for user ${userIdFilter}` : ' across all tenants'}.`);
  console.log(`Found ${fixes.length} cage(s) needing correction.`);
  if (fixes.length > 0) {
    console.log('');
    for (const f of fixes) {
      console.log(
        `  [${f.userId}] "${f.label}" (${f.cageId})\n` +
          `    before: status=${f.before.status} currentRabbit=${f.before.currentRabbit ?? 'null'}\n` +
          `    after:  status=${f.after.status} currentRabbit=${f.after.currentRabbit ?? 'null'}\n` +
          `    reason: ${f.reason}`
      );
    }
  }

  if (conflicts.length > 0) {
    console.log('');
    console.log(`⚠ ${conflicts.length} cage(s) have MORE THAN ONE active rabbit pointing at them — needs manual review:`);
    for (const c of conflicts) {
      console.log(`  "${c.label}" (${c.cageId}) — ${c.occupantCount} active rabbits claim this cage`);
    }
  }

  if (!apply) {
    console.log('');
    console.log(fixes.length > 0 ? 'Dry run only — re-run with --apply to write these changes.' : 'Nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (fixes.length === 0) {
    console.log('Nothing to apply.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('');
  console.log('Applying fixes...');
  let written = 0;
  for (const f of fixes) {
    await Cage.updateOne(
      { _id: f.cageId as unknown as Types.ObjectId, userId: f.userId },
      { status: f.after.status, currentRabbit: f.after.currentRabbit }
    );
    written += 1;
  }
  console.log(`Done. ${written} cage(s) updated.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Reconciliation failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
