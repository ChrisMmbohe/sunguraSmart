import { z } from 'zod';

// Rabbit validation schema for form data
export const RabbitFormSchema = z.object({
  ear_tag_id: z
    .string()
    .min(1, 'Ear tag ID is required')
    .max(50, 'Ear tag ID must be 50 characters or less'),
  name: z
    .string()
    .max(100, 'Name must be 100 characters or less')
    .nullable()
    .optional(),
  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Gender must be Male or Female' }),
  }),
  date_of_birth: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Date of birth must be a valid date',
    })
    .transform((date) => new Date(date)),
  breed_id: z
    .string()
    .min(1, 'Breed ID is required')
    .refine((id) => id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/), {
      message: 'Invalid breed ID format',
    }),
  current_cage_id: z
    .string()
    .min(1, 'Cage ID is required')
    .refine((id) => id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/), {
      message: 'Invalid cage ID format',
    }),
  status: z
    .enum(['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'])
    .default('Kit'),
  source_type: z
    .enum(['Born', 'Purchased', 'Gifted'])
    .default('Born'),
  source_farm: z
    .string()
    .max(100, 'Source farm must be 100 characters or less')
    .nullable()
    .optional(),
  parent_doe_id: z
    .string()
    .refine((id) => !id || id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/), {
      message: 'Invalid parent doe ID format',
    })
    .nullable()
    .optional(),
  parent_buck_id: z
    .string()
    .refine((id) => !id || id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/), {
      message: 'Invalid parent buck ID format',
    })
    .nullable()
    .optional(),
  is_pregnant: z.boolean().default(false),
  photo_url: z
    .string()
    .url('Photo URL must be a valid URL')
    .nullable()
    .optional(),
}).refine(
  (data) => {
    if (['Purchased', 'Gifted'].includes(data.source_type)) {
      return data.source_farm && data.source_farm.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Source farm/seller is required for Purchased or Gifted rabbits',
    path: ['source_farm'],
  }
);

// Create rabbit request schema (for POST)
export const CreateRabbitSchema = RabbitFormSchema;

// Update rabbit request schema (partial, for PUT)
export const UpdateRabbitSchema = RabbitFormSchema.partial();

// Query schema for rabbit list with pagination/filtering
export const RabbitQuerySchema = z.object({
  page: z
    .coerce.number()
    .int()
    .min(1, { message: 'Page must be 1 or greater' })
    .default(1),
  limit: z
    .coerce.number()
    .int()
    .min(1, { message: 'Limit must be 1 or greater' })
    .max(1000, { message: 'Limit must not exceed 1000' })
    .default(20),
  status: z
    .string()
    .optional(),
  gender: z
    .enum(['Male', 'Female'])
    .optional(),
  breed_id: z
    .string()
    .optional(),
  search: z
    .string()
    .max(100, 'Search term must be 100 characters or less')
    .optional(),
  sortBy: z
    .enum(['ear_tag_id', 'date_of_birth', 'status', 'gender', 'createdAt'])
    .default('date_of_birth'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type RabbitFormData = z.infer<typeof RabbitFormSchema>;
export type CreateRabbitRequest = z.infer<typeof CreateRabbitSchema>;
export type UpdateRabbitRequest = z.infer<typeof UpdateRabbitSchema>;
export type RabbitQueryParams = z.infer<typeof RabbitQuerySchema>;
