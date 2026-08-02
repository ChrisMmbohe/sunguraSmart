import { Schema, Model, FilterQuery } from 'mongoose';

/**
 * Every tenant-owned document carries a `userId` — the Clerk user ID of
 * the farm owner. This is the single source of truth for multi-tenant
 * data isolation: every query in every server action/route MUST filter
 * by the authenticated user's Clerk ID, and this plugin standardizes how
 * that field is declared, indexed, and queried.
 */
export interface ITenantFields {
  userId: string;
}

export interface ITenantStatics<T> extends Model<T> {
  findAllByUser(userId: string, filter?: FilterQuery<T>): ReturnType<Model<T>['find']>;
  findOneByUser(userId: string, filter?: FilterQuery<T>): ReturnType<Model<T>['findOne']>;
  countByUser(userId: string, filter?: FilterQuery<T>): ReturnType<Model<T>['countDocuments']>;
}

export function tenantPlugin<T>(schema: Schema<T>): void {
  schema.add({
    userId: {
      type: String,
      required: [true, 'userId (Clerk tenant id) is required'],
      index: true,
      immutable: true,
    },
  } as never);

  schema.statics.findAllByUser = function (userId: string, filter: FilterQuery<T> = {}) {
    return this.find({ ...filter, userId });
  };

  schema.statics.findOneByUser = function (userId: string, filter: FilterQuery<T> = {}) {
    return this.findOne({ ...filter, userId });
  };

  schema.statics.countByUser = function (userId: string, filter: FilterQuery<T> = {}) {
    return this.countDocuments({ ...filter, userId });
  };
}
