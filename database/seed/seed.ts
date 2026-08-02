/**
 * database/seed/seed.ts
 *
 * Seeds two tenant farms end-to-end: Sunrise Rabbitry (Kiambu) and
 * Janjez Rabbit Farm (Chavakali, Vihiga). Exercises every model and the
 * business-rule hooks that live on them (breeding maturity/gender
 * checks, litter -> breeding back-propagation, weight/health/feed sync,
 * sale-triggered retirement) so the seeded data is exactly what the
 * app's own validation would have produced, not a shortcut around it.
 *
 * Run with:  npx tsx database/seed/seed.ts
 * (or add a package.json script: "seed": "tsx database/seed/seed.ts")
 *
 * Safety: this ONLY ever deletes documents scoped to the two clerkIds
 * defined in FARM_CONFIGS below. It never does a blanket collection
 * wipe, so it's safe to re-run against a shared dev database.
 */

import path from 'path';
import dotenv from 'dotenv';
// This file lives at database/seed/seed.ts, so .env.local (at the repo
// root) is two levels up. __dirname-relative so this resolves correctly
// regardless of the cwd the script is invoked from.
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import mongoose from 'mongoose';
// Imported directly from each model file rather than the `database/index`
// barrel: that barrel also re-exports server-only utilities (e.g. a
// dbConnect helper guarded by the `server-only` package), which throws
// when loaded outside Next's server-component runtime - exactly the
// environment a plain tsx/node script runs in. Importing the models
// individually sidesteps that entirely.
import { User, IUser } from '../models/User.model';
import { Breed, IBreed } from '../models/Breed_model';
import { Cage, ICage } from '../models/Cage_model';
import { Disease } from '../models/Disease_model';
import { FeedType, IFeedType } from '../models/FeedType_model';
import { FeedLog } from '../models/FeedLog_model';
import { Rabbit, IRabbit } from '../models/Rabbit_model';
import { Breeding, IBreeding } from '../models/Breeding_model';
import { Litter } from '../models/Litter_model';
import { WeightLog } from '../models/WeightLog_model';
import { HealthRecord } from '../models/HealthRecord_model';
import { Schedule } from '../models/Schedule_model';
import { Sale } from '../models/Sale_model';
import { Expense } from '../models/Expense_model';
import {
  Gender,
  RabbitStatus,
  HealthStatus,
  AcquisitionType,
  RabbitPurpose,
  CageStatus,
  CageType,
  BreedingStatus,
  BreedingMethod,
  FeedCategory,
  FeedUnit,
  DiseaseSeverity,
  HealthRecordType,
  HealthRecordOutcome,
  ScheduleType,
  RecurrenceFrequency,
  ScheduleStatus,
  SaleItemType,
  PaymentMethod,
  ExpenseCategory,
} from '../../types/enums';
import { addDays, round2 } from '../utils/ownership.util';

// ---------------------------------------------------------------------------
// Deterministic PRNG so re-running the seed produces the same "random" data
// (easier to reason about while building UI against it). Swap for
// Math.random() if you want fresh data on every run.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

type Rng = () => number;
const randInt = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T,>(rng: Rng, arr: T[]): T => arr[randInt(rng, 0, arr.length - 1)];
const chance = (rng: Rng, p: number) => rng() < p;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// ---------------------------------------------------------------------------
// Farm configuration
// ---------------------------------------------------------------------------
interface FarmConfig {
  clerkId: string;
  email: string;
  farmName: string;
  location: string;
  phone: string;
  currency: string;
  tagPrefix: string;
  breedNames: string[];
  foundationDoes: number;
  foundationBucks: number;
  purchasedAdults: number;
  cagePlan: Partial<Record<CageType, number>>;
}

const FARM_CONFIGS: FarmConfig[] = [
  {
    clerkId: 'user_3GMtArPHVxhTVrRZyDqvqHuqCYB',
    email: 'amina@sunriserabbitry.com',
    farmName: 'Sunrise Rabbitry',
    location: 'Nairobi',
    phone: '+254712345001',
    currency: 'KES',
    tagPrefix: 'SR',
    breedNames: ['New Zealand White', 'Californian', 'Chinchilla', 'Flemish Giant'],
    foundationDoes: 6,
    foundationBucks: 3,
    purchasedAdults: 2,
    cagePlan: {
      [CageType.BREEDING]: 8,
      [CageType.MATERNITY]: 3,
      [CageType.GROW_OUT]: 5,
      [CageType.QUARANTINE]: 1,
      [CageType.BUCK]: 5,
    },
  },
  {
    clerkId: 'user_3GJxEbzcqFCK7bRq70W9w6LEE3m',
    email: 'chrismmbohe@gmail.com',
    farmName: 'Janjez Rabbit Farm',
    location: 'Chavakali, Vihiga',
    phone: '+254712345002',
    currency: 'KES',
    tagPrefix: 'JRF',
    breedNames: ['New Zealand White', 'Californian', 'Local Mixed'],
    foundationDoes: 4,
    foundationBucks: 2,
    purchasedAdults: 1,
    cagePlan: {
      [CageType.BREEDING]: 5,
      [CageType.MATERNITY]: 2,
      [CageType.GROW_OUT]: 3,
      [CageType.QUARANTINE]: 1,
      [CageType.BUCK]: 3,
    },
  },
];

const DISEASE_CATALOG = [
  {
    name: 'Coccidiosis',
    symptoms: ['diarrhea', 'weight loss', 'poor appetite'],
    defaultSeverity: DiseaseSeverity.MODERATE,
    isContagious: true,
    recommendedTreatment: 'Sulfaquinoxaline-based coccidiostat in drinking water for 5-7 days',
    preventionNotes: 'Keep hutch floors dry, avoid feed contamination with droppings',
  },
  {
    name: 'Pasteurellosis (Snuffles)',
    symptoms: ['nasal discharge', 'sneezing', 'labored breathing'],
    defaultSeverity: DiseaseSeverity.SEVERE,
    isContagious: true,
    recommendedTreatment: 'Broad-spectrum antibiotic course (vet-prescribed), isolate affected rabbit',
    preventionNotes: 'Improve ventilation, cull chronically infected breeding stock',
  },
  {
    name: 'Ear Mites',
    symptoms: ['head shaking', 'crusty ear scabs', 'scratching'],
    defaultSeverity: DiseaseSeverity.MILD,
    isContagious: true,
    recommendedTreatment: 'Topical ivermectin or mineral oil application',
    preventionNotes: 'Disinfect cages between occupants, inspect ears at routine checkups',
  },
  {
    name: 'GI Stasis',
    symptoms: ['reduced fecal output', 'lethargy', 'bloating'],
    defaultSeverity: DiseaseSeverity.CRITICAL,
    isContagious: false,
    recommendedTreatment: 'Increase hay/fiber, hydration support, vet consult if not resolved in 12h',
    preventionNotes: 'Ensure constant hay access and low-stress handling',
  },
  {
    name: 'Sore Hocks',
    symptoms: ['foot lesions', 'limping', 'reluctance to move'],
    defaultSeverity: DiseaseSeverity.MODERATE,
    isContagious: false,
    recommendedTreatment: 'Padded resting mat, topical antiseptic, reduce wire-floor exposure',
    preventionNotes: 'Provide solid resting boards in wire-bottom cages',
  },
];

const FEED_CATALOG = [
  {
    name: 'Rabbit Pellets - Grower',
    category: FeedCategory.PELLETS,
    unit: FeedUnit.KG,
    reorderThreshold: 20,
    costPerUnit: 65,
    consumptionRatePerRabbit: 0.12,
    consumptionPeriodDays: 1,
  },
  {
    name: 'Rhodes Grass Hay',
    category: FeedCategory.HAY,
    unit: FeedUnit.BALE,
    reorderThreshold: 3,
    costPerUnit: 450,
    consumptionRatePerRabbit: 1,
    consumptionPeriodDays: 14,
  },
  {
    name: 'Dairy Meal Supplement',
    category: FeedCategory.CONCENTRATE,
    unit: FeedUnit.KG,
    reorderThreshold: 10,
    costPerUnit: 55,
    consumptionRatePerRabbit: 0.03,
    consumptionPeriodDays: 1,
  },
  {
    name: 'Napier & Kitchen Greens',
    category: FeedCategory.GREENS,
    unit: FeedUnit.KG,
    reorderThreshold: 5,
    costPerUnit: 10,
    consumptionRatePerRabbit: 0.15,
    consumptionPeriodDays: 1,
  },
];

// ---------------------------------------------------------------------------
// Main per-farm seeding routine
// ---------------------------------------------------------------------------
async function seedFarm(cfg: FarmConfig) {
  const rng = mulberry32(hashSeed(cfg.clerkId));
  const summary: Record<string, number> = {};
  let tagSeq = 1;
  const nextTag = () => `${cfg.tagPrefix}-${String(tagSeq++).padStart(3, '0')}`;

  console.log(`\n=== Seeding ${cfg.farmName} (${cfg.clerkId}) ===`);

  // --- Wipe this tenant's existing data only (safe for shared dev DBs) ---
  await Promise.all([
    WeightLog.deleteMany({ userId: cfg.clerkId }),
    HealthRecord.deleteMany({ userId: cfg.clerkId }),
    FeedLog.deleteMany({ userId: cfg.clerkId }),
    Schedule.deleteMany({ userId: cfg.clerkId }),
    Sale.deleteMany({ userId: cfg.clerkId }),
    Expense.deleteMany({ userId: cfg.clerkId }),
    Litter.deleteMany({ userId: cfg.clerkId }),
    Breeding.deleteMany({ userId: cfg.clerkId }),
    Rabbit.deleteMany({ userId: cfg.clerkId }),
    Cage.deleteMany({ userId: cfg.clerkId }),
    Disease.deleteMany({ userId: cfg.clerkId }),
    FeedType.deleteMany({ userId: cfg.clerkId }),
    Breed.deleteMany({ userId: cfg.clerkId }),
  ]);
  await User.deleteOne({ clerkId: cfg.clerkId });

  // --- User (the tenant itself) ---
  const user: IUser = await User.create({
    clerkId: cfg.clerkId,
    email: cfg.email,
    farmName: cfg.farmName,
    location: cfg.location,
    phone: cfg.phone,
    currency: cfg.currency,
    onboardingCompleted: true,
  });
  summary.users = 1;
  console.log(`   Tenant user ready: ${user.email} (${user.farmName}, ${user.currency})`);

  // --- Breeds ---
  const breeds: IBreed[] = [];
  for (const name of cfg.breedNames) {
    breeds.push(
      await Breed.create({
        userId: cfg.clerkId,
        name,
        description: `${name} rabbits kept for meat and breeding stock.`,
        averageAdultWeightKg: round2(3.5 + rng() * 2),
        averageLitterSize: randInt(rng, 5, 8),
        gestationDays: 31,
        maturityAgeDays: randInt(rng, 135, 165),
        weaningAgeDays: 42,
      })
    );
  }
  summary.breeds = breeds.length;

  // --- Cages ---
  const cageTypeMeta: Record<CageType, { code: string; capacity: number }> = {
    [CageType.BREEDING]: { code: 'BRD', capacity: 1 },
    [CageType.MATERNITY]: { code: 'MAT', capacity: 1 },
    [CageType.GROW_OUT]: { code: 'GRW', capacity: 6 },
    [CageType.QUARANTINE]: { code: 'QTN', capacity: 1 },
    [CageType.BUCK]: { code: 'BCK', capacity: 1 },
  };
  const cagesByType: Record<string, ICage[]> = {};
  for (const [type, count] of Object.entries(cfg.cagePlan) as [CageType, number][]) {
    const meta = cageTypeMeta[type];
    cagesByType[type] = [];
    for (let i = 1; i <= count; i++) {
      const cage = await Cage.create({
        userId: cfg.clerkId,
        label: `${meta.code}-${i}`,
        type,
        status: CageStatus.EMPTY,
        capacity: meta.capacity,
        location: type === CageType.QUARANTINE ? 'Isolation shed' : `Shed ${meta.code[0]}, Row ${i}`,
      });
      cagesByType[type].push(cage);
    }
  }
  summary.cages = Object.values(cagesByType).reduce((s, arr) => s + arr.length, 0);

  // --- Diseases (shared catalog, tenant-scoped copies) ---
  const diseases = [];
  for (const d of DISEASE_CATALOG) {
    diseases.push(await Disease.create({ userId: cfg.clerkId, ...d }));
  }
  summary.diseases = diseases.length;

  // --- Feed types ---
  const feedTypes: IFeedType[] = [];
  for (const f of FEED_CATALOG) {
    feedTypes.push(await FeedType.create({ userId: cfg.clerkId, stockOnHand: 0, ...f }));
  }
  summary.feedTypes = feedTypes.length;

  // -------------------------------------------------------------------
  // Foundation rabbits (mature breeding stock)
  // -------------------------------------------------------------------
  const takeCage = (pool: ICage[], idxRef: { i: number }) =>
    idxRef.i < pool.length ? pool[idxRef.i++]._id : null; // no wraparound: capacity-1 cages must not double up
  const breedingCageRef = { i: 0 };
  const buckCageRef = { i: 0 };

  const does: IRabbit[] = [];
  for (let i = 0; i < cfg.foundationDoes; i++) {
    const breed = pick(rng, breeds);
    const isQuarantined = i === 0 && cfg.foundationDoes > 3; // one demo case per larger farm
    const cage = isQuarantined
      ? cagesByType[CageType.QUARANTINE]?.[0]?._id ?? null
      : takeCage(cagesByType[CageType.BREEDING] ?? [], breedingCageRef);

    const doe = await Rabbit.create({
      userId: cfg.clerkId,
      tagNumber: nextTag(),
      name: undefined,
      breed: breed._id,
      gender: Gender.FEMALE,
      dateOfBirth: daysAgo(randInt(rng, 320, 620)),
      status: RabbitStatus.ACTIVE,
      healthStatus: isQuarantined ? HealthStatus.QUARANTINED : HealthStatus.HEALTHY,
      acquisitionType: AcquisitionType.BORN_ON_FARM,
      acquisitionDate: daysAgo(randInt(rng, 320, 620)),
      purpose: RabbitPurpose.BREEDING_STOCK,
      cage,
      color: pick(rng, ['White', 'Grey', 'Brown', 'Black', 'Broken']),
    });
    does.push(doe);
  }

  const bucks: IRabbit[] = [];
  for (let i = 0; i < cfg.foundationBucks; i++) {
    const breed = pick(rng, breeds);
    const isRetired = i === cfg.foundationBucks - 1 && cfg.foundationBucks > 2;
    const cage = takeCage(cagesByType[CageType.BUCK] ?? [], buckCageRef);

    const buck = await Rabbit.create({
      userId: cfg.clerkId,
      tagNumber: nextTag(),
      breed: breed._id,
      gender: Gender.MALE,
      dateOfBirth: daysAgo(randInt(rng, 340, 700)),
      status: isRetired ? RabbitStatus.RETIRED : RabbitStatus.ACTIVE,
      healthStatus: HealthStatus.HEALTHY,
      acquisitionType: AcquisitionType.BORN_ON_FARM,
      acquisitionDate: daysAgo(randInt(rng, 340, 700)),
      purpose: RabbitPurpose.BREEDING_STOCK,
      cage: isRetired ? null : cage,
      color: pick(rng, ['White', 'Grey', 'Brown', 'Black', 'Broken']),
    });
    bucks.push(buck);
  }

  // --- Purchased adult stock (fresh genetics) ---
  const purchased: IRabbit[] = [];
  for (let i = 0; i < cfg.purchasedAdults; i++) {
    const breed = pick(rng, breeds);
    const gender = chance(rng, 0.5) ? Gender.FEMALE : Gender.MALE;
    const cost = randInt(rng, 1800, 3500);
    const pool = gender === Gender.FEMALE ? cagesByType[CageType.BREEDING] : cagesByType[CageType.BUCK];
    const ref = gender === Gender.FEMALE ? breedingCageRef : buckCageRef;
    const rabbit = await Rabbit.create({
      userId: cfg.clerkId,
      tagNumber: nextTag(),
      breed: breed._id,
      gender,
      dateOfBirth: daysAgo(randInt(rng, 250, 400)),
      status: RabbitStatus.ACTIVE,
      healthStatus: HealthStatus.HEALTHY,
      acquisitionType: AcquisitionType.PURCHASED,
      acquisitionDate: daysAgo(randInt(rng, 30, 90)),
      sourceFarm: pick(rng, ['Kakamega Rabbit Breeders Co-op', 'Naivasha Cuniculture Ltd', 'Nyeri Highland Rabbitry']),
      acquisitionCost: cost,
      purpose: RabbitPurpose.BREEDING_STOCK,
      cage: takeCage(pool ?? [], ref),
      color: pick(rng, ['White', 'Grey', 'Brown']),
    });
    purchased.push(rabbit);
    if (gender === Gender.FEMALE) does.push(rabbit);
    else bucks.push(rabbit);

    await Expense.create({
      userId: cfg.clerkId,
      category: ExpenseCategory.BREEDING_STOCK,
      description: `Purchase of ${gender === Gender.FEMALE ? 'doe' : 'buck'} ${rabbit.tagNumber} from ${rabbit.sourceFarm}`,
      amount: cost,
      paymentMethod: PaymentMethod.MPESA,
      date: rabbit.acquisitionDate,
      relatedRabbit: rabbit._id,
    });
  }

  const breedingEligibleDoes = does.filter((d) => d.healthStatus !== HealthStatus.QUARANTINED);
  const activeBucks = bucks.filter((b) => b.status === RabbitStatus.ACTIVE);
  summary.rabbits_foundation = does.length + bucks.length;

  // -------------------------------------------------------------------
  // Weight logs (with intentionally stale entries for a subset)
  // -------------------------------------------------------------------
  const allFoundation = [...does, ...bucks];
  let staleCount = 0;
  for (const rabbit of allFoundation) {
    if (rabbit.status !== RabbitStatus.ACTIVE) continue;
    const entries = randInt(rng, 3, 5);
    const makeStale = staleCount < Math.ceil(allFoundation.length * 0.2);
    for (let e = 0; e < entries; e++) {
      const daysBack = makeStale
        ? randInt(rng, 55, 90) - e * 15
        : randInt(rng, 5, 85) - e * 20;
      if (daysBack < 0) continue;
      await WeightLog.create({
        userId: cfg.clerkId,
        rabbit: rabbit._id,
        weightKg: round2(3.2 + rng() * 2.3),
        recordedAt: daysAgo(daysBack),
        notes: e === 0 ? 'Routine monthly weigh-in' : undefined,
      });
    }
    if (makeStale) staleCount++;
  }

  // -------------------------------------------------------------------
  // Breedings + Litters
  // -------------------------------------------------------------------
  const retainedKits: IRabbit[] = [];
  let breedingCount = 0;
  let litterCount = 0;

  async function pairFor(doe: IRabbit, buck: IRabbit, pairedDate: Date): Promise<IBreeding> {
    const breeding = await Breeding.create({
      userId: cfg.clerkId,
      doe: doe._id,
      buck: buck._id,
      method: chance(rng, 0.9) ? BreedingMethod.NATURAL : BreedingMethod.ARTIFICIAL_INSEMINATION,
      pairedDate,
    });
    breedingCount++;
    return breeding;
  }

  if (breedingEligibleDoes.length && activeBucks.length) {
    // 1) Two completed pairings -> litters (one weaned, one still nursing)
    for (let i = 0; i < Math.min(2, breedingEligibleDoes.length); i++) {
      const doe = breedingEligibleDoes[i];
      const buck = pick(rng, activeBucks);
      const gestation = breeds.find((b) => b._id.equals(doe.breed))?.gestationDays ?? 31;
      const pairedDate = daysAgo(gestation + randInt(rng, 20, 55));
      const breeding = await pairFor(doe, buck, pairedDate);

      breeding.status = BreedingStatus.CONFIRMED_PREGNANT;
      breeding.confirmedPregnantDate = addDays(pairedDate, 12);
      await breeding.save();

      const kindleDate = breeding.expectedDueDate;
      const bornAlive = randInt(rng, 5, 9);
      const bornDead = chance(rng, 0.3) ? 1 : 0;
      const isWeaned = i === 0; // first one fully weaned, second still nursing

      const litter = await Litter.create({
        userId: cfg.clerkId,
        breeding: breeding._id,
        doe: doe._id,
        buck: buck._id,
        kindleDate,
        kitsBornAlive: bornAlive,
        kitsBornDead: bornDead,
        mortalityEvents: chance(rng, 0.4) ? [{ date: addDays(kindleDate, 4), count: 1, cause: 'crushed by doe' }] : [],
        kitsWeaned: isWeaned ? Math.max(1, bornAlive - randInt(rng, 0, 2)) : undefined,
        weaningDate: isWeaned ? addDays(kindleDate, 42) : undefined,
      });
      litterCount++;
      console.log(`   Litter ${litter._id} (${bornAlive} born alive) linked to breeding ${breeding._id}`);

      // Tag/retain a representative sample of the litter's kits as tracked
      // individual Rabbit records (realistic: farmers select+tag the best
      // kits, not every single one, before/around weaning).
      const retainCount = Math.min(bornAlive, isWeaned ? 3 : 2);
      for (let k = 0; k < retainCount; k++) {
        const kit = await Rabbit.create({
          userId: cfg.clerkId,
          tagNumber: nextTag(),
          breed: doe.breed,
          gender: chance(rng, 0.5) ? Gender.FEMALE : Gender.MALE,
          dateOfBirth: kindleDate,
          status: RabbitStatus.ACTIVE,
          healthStatus: HealthStatus.HEALTHY,
          sire: buck._id,
          dam: doe._id,
          acquisitionType: AcquisitionType.BORN_ON_FARM,
          acquisitionDate: kindleDate,
          purpose: chance(rng, 0.6) ? RabbitPurpose.MEAT : RabbitPurpose.BREEDING_STOCK,
          cage: isWeaned ? takeCage(cagesByType[CageType.GROW_OUT] ?? [], { i: retainedKits.length }) : null,
        });
        retainedKits.push(kit);

        if (isWeaned) {
          await WeightLog.create({
            userId: cfg.clerkId,
            rabbit: kit._id,
            weightKg: round2(0.9 + rng() * 0.6),
            recordedAt: addDays(kindleDate, 42),
            notes: 'Weaning weight',
          });
        }
      }
    }

    // 2) Upcoming pairing (due soon) - CONFIRMED_PREGNANT, due within days
    if (breedingEligibleDoes.length > 2) {
      const doe = breedingEligibleDoes[2];
      const buck = pick(rng, activeBucks);
      const gestation = breeds.find((b) => b._id.equals(doe.breed))?.gestationDays ?? 31;
      const pairedDate = daysAgo(gestation - 2);
      const breeding = await pairFor(doe, buck, pairedDate);
      breeding.status = BreedingStatus.CONFIRMED_PREGNANT;
      breeding.confirmedPregnantDate = addDays(pairedDate, 12);
      await breeding.save();
    }

    // 3) Overdue pairing - still PAIRED past its expected due date
    if (breedingEligibleDoes.length > 3) {
      const doe = breedingEligibleDoes[3];
      const buck = pick(rng, activeBucks);
      const gestation = breeds.find((b) => b._id.equals(doe.breed))?.gestationDays ?? 31;
      const pairedDate = daysAgo(gestation + randInt(rng, 3, 8));
      await pairFor(doe, buck, pairedDate);
    }

    // 4) Failed pairing
    if (breedingEligibleDoes.length > 4) {
      const doe = breedingEligibleDoes[4];
      const buck = pick(rng, activeBucks);
      const pairedDate = daysAgo(randInt(rng, 40, 70));
      const breeding = await pairFor(doe, buck, pairedDate);
      breeding.status = BreedingStatus.FAILED;
      breeding.failureReason = 'No conception detected on palpation check';
      await breeding.save();
    }

    // 5) Aborted pairing
    if (breedingEligibleDoes.length > 5) {
      const doe = breedingEligibleDoes[5];
      const buck = pick(rng, activeBucks);
      const pairedDate = daysAgo(randInt(rng, 25, 40));
      const breeding = await pairFor(doe, buck, pairedDate);
      breeding.status = BreedingStatus.ABORTED;
      breeding.confirmedPregnantDate = addDays(pairedDate, 12);
      breeding.failureReason = 'Litter absorbed / lost mid-pregnancy';
      await breeding.save();
    }
  }
  summary.breedings = breedingCount;
  summary.litters = litterCount;
  summary.rabbits_retained_kits = retainedKits.length;

  // -------------------------------------------------------------------
  // Health records (+ matching follow-up Schedule entries, mirroring
  // what the app's syncFollowUpSchedule server action does)
  // -------------------------------------------------------------------
  const allRabbits = [...does, ...bucks, ...retainedKits];
  const healthEvents: { rabbit: IRabbit; type: HealthRecordType; outcome: HealthRecordOutcome; diseaseIdx?: number; cost: number; followUp: boolean }[] =
    [];

  if (allRabbits.length) {
    healthEvents.push(
      { rabbit: allRabbits[0], type: HealthRecordType.VACCINATION, outcome: HealthRecordOutcome.RECOVERED, cost: 150, followUp: true }
    );
  }
  if (allRabbits.length > 1) {
    healthEvents.push({
      rabbit: allRabbits[1],
      type: HealthRecordType.ILLNESS,
      outcome: HealthRecordOutcome.RECOVERED,
      diseaseIdx: 0, // coccidiosis
      cost: 400,
      followUp: true,
    });
  }
  if (allRabbits.length > 2) {
    healthEvents.push({
      rabbit: allRabbits[2],
      type: HealthRecordType.ILLNESS,
      outcome: HealthRecordOutcome.CHRONIC,
      diseaseIdx: 1, // pasteurellosis
      cost: 650,
      followUp: true,
    });
  }
  if (allRabbits.length > 3) {
    healthEvents.push({
      rabbit: allRabbits[3],
      type: HealthRecordType.DEWORMING,
      outcome: HealthRecordOutcome.ONGOING,
      cost: 100,
      followUp: false,
    });
  }
  if (allRabbits.length > 4) {
    healthEvents.push({
      rabbit: allRabbits[4],
      type: HealthRecordType.INJURY,
      outcome: HealthRecordOutcome.ONGOING,
      cost: 300,
      followUp: true,
    });
  }
  // One mortality event, for realism in the health/status distribution.
  const deceasedCandidate = allFoundation[allFoundation.length - 1];
  if (deceasedCandidate) {
    healthEvents.push({
      rabbit: deceasedCandidate,
      type: HealthRecordType.ILLNESS,
      outcome: HealthRecordOutcome.DECEASED,
      diseaseIdx: 3, // GI stasis
      cost: 200,
      followUp: false,
    });
  }

  let healthRecordCount = 0;
  let scheduleCount = 0;
  for (const ev of healthEvents) {
    const followUpDate = ev.followUp ? addDays(new Date(), randInt(rng, 5, 21)) : undefined;
    const record = await HealthRecord.create({
      userId: cfg.clerkId,
      rabbit: ev.rabbit._id,
      type: ev.type,
      disease: ev.diseaseIdx !== undefined ? diseases[ev.diseaseIdx]._id : null,
      date: daysAgo(randInt(rng, 3, 30)),
      treatment: ev.diseaseIdx !== undefined ? diseases[ev.diseaseIdx].recommendedTreatment : undefined,
      cost: ev.cost,
      outcome: ev.outcome,
      followUpDate,
      notes: ev.type === HealthRecordType.INJURY ? 'Minor foot laceration, cleaned and bandaged' : undefined,
    });
    healthRecordCount++;

    await Expense.create({
      userId: cfg.clerkId,
      category: ExpenseCategory.VETERINARY,
      description: `${ev.type.replace('_', ' ')} - ${ev.rabbit.tagNumber}`,
      amount: ev.cost,
      paymentMethod: PaymentMethod.CASH,
      date: record.date,
      relatedRabbit: ev.rabbit._id,
    });

    if (followUpDate) {
      await Schedule.create({
        userId: cfg.clerkId,
        title: `Follow-up: ${ev.type.replace('_', ' ')} check for ${ev.rabbit.tagNumber}`,
        type: ScheduleType.HEALTH_CHECK,
        rabbit: ev.rabbit._id,
        dueDate: followUpDate,
        recurrence: { frequency: RecurrenceFrequency.NONE },
        relatedHealthRecord: record._id,
      });
      scheduleCount++;
    }
  }
  summary.healthRecords = healthRecordCount;

  // -------------------------------------------------------------------
  // Feed logs (restocks -> matching Expense, then consumption drawdown)
  // -------------------------------------------------------------------
  let feedLogCount = 0;
  for (const feedType of feedTypes) {
    for (const daysBack of [55, 20]) {
      const qty = feedType.unit === FeedUnit.BALE ? randInt(rng, 8, 15) : randInt(rng, 80, 150);
      const restockDate = daysAgo(daysBack);
      await FeedLog.create({
        userId: cfg.clerkId,
        feedType: feedType._id,
        direction: 'restock',
        quantity: qty,
        date: restockDate,
        notes: 'Bulk restock',
      });
      feedLogCount++;
      await Expense.create({
        userId: cfg.clerkId,
        category: ExpenseCategory.FEED,
        description: `Restock: ${feedType.name} (${qty} ${feedType.unit})`,
        amount: round2(qty * (feedType.costPerUnit ?? 0)),
        paymentMethod: chance(rng, 0.5) ? PaymentMethod.MPESA : PaymentMethod.CASH,
        date: restockDate,
        relatedFeedType: feedType._id,
      });
    }
    for (let w = 0; w < 6; w++) {
      const consumeQty = feedType.unit === FeedUnit.BALE ? randInt(rng, 1, 2) : randInt(rng, 8, 18);
      await FeedLog.create({
        userId: cfg.clerkId,
        feedType: feedType._id,
        direction: 'consumption',
        quantity: consumeQty,
        rabbitsFed: allRabbits.filter((r) => r.status === RabbitStatus.ACTIVE).length,
        date: daysAgo(w * 7 + 2),
        notes: 'Weekly feeding round',
      });
      feedLogCount++;
    }
  }
  summary.feedLogs = feedLogCount;

  // -------------------------------------------------------------------
  // Standalone / recurring Schedule tasks
  // -------------------------------------------------------------------
  const standaloneSchedules = [
    {
      title: 'Farm-wide deworming round',
      type: ScheduleType.DEWORMING,
      dueDate: addDays(new Date(), 10),
      recurrence: { frequency: RecurrenceFrequency.CUSTOM_DAYS, customDays: 90 },
      status: ScheduleStatus.PENDING,
    },
    {
      title: 'Pellet stock restock reminder',
      type: ScheduleType.FEEDING_RESTOCK,
      dueDate: addDays(new Date(), 4),
      recurrence: { frequency: RecurrenceFrequency.MONTHLY },
      status: ScheduleStatus.PENDING,
    },
    {
      title: 'Overdue: quarterly vaccination catch-up',
      type: ScheduleType.VACCINATION,
      dueDate: daysAgo(5),
      recurrence: { frequency: RecurrenceFrequency.NONE },
      status: ScheduleStatus.PENDING, // intentionally overdue for alert-panel testing
    },
    {
      title: 'Cage sanitation - breeding row',
      type: ScheduleType.OTHER,
      dueDate: daysAgo(14),
      recurrence: { frequency: RecurrenceFrequency.NONE },
      status: ScheduleStatus.COMPLETED,
      completedDate: daysAgo(13),
    },
  ];
  let scheduleStandaloneCount = 0;
  for (const s of standaloneSchedules) {
    await Schedule.create({
      userId: cfg.clerkId,
      title: s.title,
      type: s.type,
      dueDate: s.dueDate,
      status: s.status,
      recurrence: s.recurrence,
      completedDate: (s as { completedDate?: Date }).completedDate,
    });
    scheduleStandaloneCount++;
  }
  summary.schedules = scheduleCount + scheduleStandaloneCount;

  // -------------------------------------------------------------------
  // Sales (live rabbits + meat) and remaining operating expenses
  // -------------------------------------------------------------------
  const sellableRabbits = retainedKits.filter((k) => k.purpose === RabbitPurpose.MEAT || chance(rng, 0.3));
  let saleCount = 0;
  for (let i = 0; i < Math.min(2, sellableRabbits.length); i++) {
    const rabbit = sellableRabbits[i];
    await Sale.create({
      userId: cfg.clerkId,
      buyerName: pick(rng, ['James Otieno', 'Grace Wanjiru', 'Peter Kiplagat', 'Mary Achieng']),
      buyerContact: `+2547${randInt(rng, 10000000, 99999999)}`,
      items: [
        {
          itemType: SaleItemType.LIVE_RABBIT,
          rabbit: rabbit._id,
          description: `${rabbit.purpose === RabbitPurpose.MEAT ? 'Meat' : 'Breeding'} stock rabbit`,
          quantity: 1,
          unitPrice: rabbit.purpose === RabbitPurpose.MEAT ? randInt(rng, 900, 1400) : randInt(rng, 2000, 3500),
        },
      ],
      totalAmount: 0, // recomputed by pre-validate hook
      paymentMethod: chance(rng, 0.7) ? PaymentMethod.MPESA : PaymentMethod.CASH,
      date: daysAgo(randInt(rng, 3, 60)),
    });
    saleCount++;
  }
  // A couple of processed-meat / by-product sales not tied to a specific rabbit record.
  await Sale.create({
    userId: cfg.clerkId,
    buyerName: 'Vihiga Butchery',
    items: [
      { itemType: SaleItemType.MEAT, description: 'Dressed rabbit meat (bulk)', quantity: 12, unitPrice: 550 },
    ],
    totalAmount: 0,
    paymentMethod: PaymentMethod.MPESA,
    date: daysAgo(randInt(rng, 10, 45)),
  });
  saleCount++;
  await Sale.create({
    userId: cfg.clerkId,
    buyerName: 'Local kitchen garden customer',
    items: [{ itemType: SaleItemType.MANURE, description: 'Rabbit manure, 50kg sacks', quantity: 3, unitPrice: 300 }],
    totalAmount: 0,
    paymentMethod: PaymentMethod.CASH,
    date: daysAgo(randInt(rng, 5, 50)),
  });
  saleCount++;
  summary.sales = saleCount;

  // Recurring overhead expenses spread across the last 6 months, for the
  // monthly trend / net-profit charts to have real month-over-month shape.
  let opexCount = 0;
  for (let m = 0; m < 6; m++) {
    const monthDate = daysAgo(m * 30 + randInt(rng, 1, 5));
    await Expense.create({
      userId: cfg.clerkId,
      category: ExpenseCategory.LABOR,
      description: 'Farm attendant monthly wage',
      amount: randInt(rng, 6000, 9000),
      paymentMethod: PaymentMethod.MPESA,
      date: monthDate,
    });
    opexCount++;
    await Expense.create({
      userId: cfg.clerkId,
      category: ExpenseCategory.UTILITIES,
      description: 'Water and electricity',
      amount: randInt(rng, 800, 2000),
      paymentMethod: PaymentMethod.MPESA,
      date: monthDate,
    });
    opexCount++;
    if (chance(rng, 0.4)) {
      await Expense.create({
        userId: cfg.clerkId,
        category: ExpenseCategory.EQUIPMENT,
        description: pick(rng, ['Automatic water nipples (pack)', 'Replacement feeders', 'Wire mesh for cage repair']),
        amount: randInt(rng, 1200, 4500),
        paymentMethod: PaymentMethod.CASH,
        date: monthDate,
      });
      opexCount++;
    }
    if (chance(rng, 0.3)) {
      await Expense.create({
        userId: cfg.clerkId,
        category: ExpenseCategory.UPKEEP,
        description: 'Cage and shed maintenance',
        amount: randInt(rng, 500, 2000),
        paymentMethod: PaymentMethod.CASH,
        date: monthDate,
      });
      opexCount++;
    }
  }
  summary.expenses_opex = opexCount;

  console.log(`   ${cfg.farmName}:`, summary);
  return summary;
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set (checked process.env after loading ../.env.local)');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  try {
    for (const cfg of FARM_CONFIGS) {
      await seedFarm(cfg);
    }
    console.log('\nSeed complete.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
