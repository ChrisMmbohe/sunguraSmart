import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILitter extends Document {
  breeding_id: mongoose.Types.ObjectId;
  kindling_date: Date;
  num_kits_born: number | null;
  num_kits_alive: number | null;
  num_kits_weaned: number | null;
  wean_date: Date | null;
  litter_tag_prefix: string | null;
  notes: string | null;
  user_id: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  success_rate: number;
}

interface ILitterModel extends Model<ILitter> {}

const litterSchema = new Schema<ILitter, ILitterModel>(
  {
    breeding_id: {
      type: Schema.Types.ObjectId,
      ref: 'Breeding',
      required: true,
    },
    kindling_date: {
      type: Date,
      required: true,
    },
    num_kits_born: {
      type: Number,
      default: null,
      min: 0,
    },
    num_kits_alive: {
      type: Number,
      default: null,
      min: 0,
    },
    num_kits_weaned: {
      type: Number,
      default: null,
      min: 0,
    },
    wean_date: {
      type: Date,
      default: null,
    },
    litter_tag_prefix: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    user_id: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Update breeding status, sync doe pregnancy, auto-create kit rabbits
litterSchema.pre('save', async function (next) {
  try {
    this.kindling_date = new Date(this.kindling_date.setUTCHours(0, 0, 0, 0));

    // Calculate wean_date if num_kits_weaned is set (~28 days post-kindling)
    if (this.num_kits_weaned && this.num_kits_weaned > 0 && !this.wean_date) {
      const weanDate = new Date(this.kindling_date);
      weanDate.setDate(weanDate.getDate() + 28);
      this.wean_date = weanDate;
    }

    // Update breeding status to 'Kindled' and doe pregnancy to false
    if (this.isNew || this.isModified('kindling_date')) {
      const Breeding = mongoose.model('Breeding');
      const breeding = await Breeding.findById(this.breeding_id);

      if (!breeding) throw new Error('Breeding record not found');

      // Update breeding status
      breeding.status = 'Mated';
      await breeding.save();

      // Update doe pregnancy status
      const Rabbit = mongoose.model('Rabbit');
      const doe = await Rabbit.findById(breeding.doe_id);
      if (doe) {
        doe.is_pregnant = false;
        await doe.save();
      }

      // Auto-create kit rabbit documents
      if (this.num_kits_born && this.num_kits_born > 0 && this.litter_tag_prefix) {
        const kits = [];
        for (let i = 1; i <= this.num_kits_born; i++) {
          kits.push({
            tag_id: `${this.litter_tag_prefix}-${i}`,
            acquisition_type: 'born',
            acquisition_date: this.kindling_date,
            date_of_birth: this.kindling_date,
            sire_id: breeding.buck_id,
            dam_id: breeding.doe_id,
            user_id: this.user_id,
            status: 'Active',
            gender: 'Male', // Default - should be updated manually
          });
        }
        await Rabbit.insertMany(kits);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Virtual: Success rate (kits weaned / kits born)
litterSchema.virtual('success_rate').get(function () {
  if (!this.num_kits_born || this.num_kits_born === 0) return 0;
  return ((this.num_kits_weaned || 0) / this.num_kits_born) * 100;
});

// Indexes
litterSchema.index({ breeding_id: 1 });
litterSchema.index({ user_id: 1, kindling_date: -1 });

litterSchema.set('toJSON', { virtuals: true });
litterSchema.set('toObject', { virtuals: true });

const Litter = (mongoose.models.Litter as ILitterModel) || mongoose.model<ILitter, ILitterModel>('Litter', litterSchema);

export default Litter;
