import { Schema, model, models, Model, Document } from 'mongoose';

/**
 * NOTE: This model does NOT use the tenant plugin — it IS the tenant.
 * Every other model's `userId` field refers to `clerkId` here.
 */
export interface IUser extends Document {
  clerkId: string;
  email: string;
  farmName: string;
  location?: string;
  phone?: string;
  currency: string;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {
  findByClerkId(clerkId: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    farmName: {
      type: String,
      required: true,
      trim: true,
    },
    location: { type: String, trim: true },
    phone: { type: String, trim: true },
    currency: {
      type: String,
      default: 'KES',
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

UserSchema.statics.findByClerkId = function (clerkId: string) {
  return this.findOne({ clerkId });
};

export const User = (models.User as IUserModel) || model<IUser, IUserModel>('User', UserSchema);
