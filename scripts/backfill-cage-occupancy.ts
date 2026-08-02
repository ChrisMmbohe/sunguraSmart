/**
 * One-off backfill: recomputes Cage.status / Cage.currentRabbit for every
 * existing cage from a live count of ACTIVE rabbits, for records that went
 * stale before the Rabbit_model.ts sync hooks were fixed (seeded data,
 * saves that predate the fix, etc).
 *
 * This mirrors syncCageOccupancy() in Rabbit_model.ts exactly, plus the
 * same "don't clobber a manually-set non-occupancy status" nuance used in
 * the Cage Cards page's derived-status fix: an empty cage that's been
 * manually marked e.g. "maintenance" keeps that status; only the
 * occupied/empty distinction is corrected.
 *
 * Usage:
 *   npx tsx scripts/backfill-cage-occupancy.ts            # applies fixes
 *   npx tsx scripts/backfill-cage-occupancy.ts --dry-run   # report only
 *
 * Adjust the tsx/ts-node invocation to whatever runner the existing seed
 * script uses in package.json if it differs.
 */

import path from 'path';
import dotenv from 'dotenv';

// Same __dirname-relative resolution used for the seed script — this file
// is expected to live in scripts/, one level below the project root where
// .env.local lives.
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import mongoose from 'mongoose';
import { Cage } from '../database/models/Cage_model';
import { Rabbit } from '../database/models/Rabbit_model';
import { RabbitStatus, CageStatus } from '../types/enums';

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set — check .env.local is present and dotenv resolved it.');
  }
  await mongoose.connect(uri);
}

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  await connect();

  const cages = await Cage.find({}).select('label userId status currentRabbit capacity');
  console.log(`Found ${cages.length} cage${cages.length === 1 ? '' : 's'} across all tenants.${DRY_RUN ? ' (dry run — no writes)' : ''}\n`);

  let corrected = 0;
  let unchanged = 0;

  for (const cage of cages) {
    const [occupantCount, latestOccupant] = await Promise.all([
      Rabbit.countDocuments({ userId: cage.userId, cage: cage._id, status: RabbitStatus.ACTIVE }),
      Rabbit.findOne({ userId: cage.userId, cage: cage._id, status: RabbitStatus.ACTIVE })
        .sort({ updatedAt: -1 })
        .select('_id'),
    ]);

    // Same rule as the Cage Cards page's derived-status fix: occupants
    // present always wins as OCCUPIED; zero occupants falls back to EMPTY
    // unless the stored status is some other non-occupancy state (e.g.
    // maintenance), which is left alone.
    const desiredStatus =
      occupantCount > 0
        ? CageStatus.OCCUPIED
        : cage.status === CageStatus.OCCUPIED
        ? CageStatus.EMPTY
        : cage.status;

    const desiredCurrentRabbit = occupantCount > 0 ? latestOccupant?._id ?? null : null;

    const statusChanged = cage.status !== desiredStatus;
    const occupantChanged = String(cage.currentRabbit ?? '') !== String(desiredCurrentRabbit ?? '');

    if (!statusChanged && !occupantChanged) {
      unchanged++;
      continue;
    }

    corrected++;
    console.log(
      `${cage.label} (${cage._id}): status ${cage.status} -> ${desiredStatus}` +
        (occupantChanged ? `, currentRabbit ${cage.currentRabbit ?? 'null'} -> ${desiredCurrentRabbit ?? 'null'}` : '') +
        ` [live occupants: ${occupantCount}/${cage.capacity}]`
    );

    if (!DRY_RUN) {
      await Cage.updateOne(
        { _id: cage._id },
        { status: desiredStatus, currentRabbit: desiredCurrentRabbit }
      );
    }
  }

  console.log(`\n${corrected} cage${corrected === 1 ? '' : 's'} corrected, ${unchanged} already accurate.`);
  if (DRY_RUN && corrected > 0) {
    console.log('Re-run without --dry-run to apply these changes.');
  }
}

main()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Backfill failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  });
