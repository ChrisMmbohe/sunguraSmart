import { z } from 'zod';

// Cage validation schema
export const CageFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Cage name is required')
    .max(50, 'Cage name must be 50 characters or less'),
  location_area: z
    .string()
    .min(1, 'Location area is required')
    .max(100, 'Location area must be 100 characters or less'),
  capacity: z
    .number()
    .int()
    .positive('Capacity must be a positive number'),
  cage_type: z.enum(['Buck', 'Doe', 'Grower', 'Quarantine', 'Nesting'], {
    errorMap: () => ({ message: 'Invalid cage type' }),
  }),
});

export const CreateCageSchema = CageFormSchema;
export const UpdateCageSchema = CageFormSchema.partial();

export const CageQuerySchema = z.object({
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
  cage_type: z
    .enum(['Buck', 'Doe', 'Grower', 'Quarantine', 'Nesting'])
    .optional(),
  search: z
    .string()
    .max(100, 'Search term must be 100 characters or less')
    .optional(),
  sortBy: z
    .enum(['name', 'location_area', 'capacity', 'cage_type', 'createdAt'])
    .default('name'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

export type CageFormData = z.infer<typeof CageFormSchema>;
export type CreateCageRequest = z.infer<typeof CreateCageSchema>;
export type UpdateCageRequest = z.infer<typeof UpdateCageSchema>;
export type CageQueryParams = z.infer<typeof CageQuerySchema>;
