import { z } from 'zod';

// Breed validation schema
export const BreedFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Breed name is required')
    .max(100, 'Breed name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
  average_mature_weight_kg: z
    .number()
    .positive('Average mature weight must be a positive number'),
  maturity_age_days: z
    .number()
    .int()
    .positive('Maturity age must be a positive number'),
  weaning_age_days: z
    .number()
    .int()
    .positive('Weaning age must be a positive number'),
  grower_age_days: z
    .number()
    .int()
    .positive('Grower age must be a positive number'),
});

export const CreateBreedSchema = BreedFormSchema;
export const UpdateBreedSchema = BreedFormSchema.partial();

export const BreedQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .refine((n) => n >= 1, { message: 'Page must be 1 or greater' })
    .default('1'),
  limit: z
    .string()
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100, { message: 'Limit must be between 1 and 100' })
    .default('20'),
  search: z
    .string()
    .max(100, 'Search term must be 100 characters or less')
    .optional(),
  sortBy: z
    .enum(['name', 'average_mature_weight_kg', 'maturity_age_days', 'createdAt'])
    .default('name'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

export type BreedFormData = z.infer<typeof BreedFormSchema>;
export type CreateBreedRequest = z.infer<typeof CreateBreedSchema>;
export type UpdateBreedRequest = z.infer<typeof UpdateBreedSchema>;
export type BreedQueryParams = z.infer<typeof BreedQuerySchema>;
