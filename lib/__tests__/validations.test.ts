import { CreateRabbitSchema, RabbitQuerySchema, UpdateRabbitSchema } from '@/lib/validations/rabbit';
import { CreateBreedSchema, UpdateBreedSchema } from '@/lib/validations/breed';
import { CreateCageSchema, UpdateCageSchema } from '@/lib/validations/cage';
import { ZodError } from 'zod';

/**
 * Unit tests for API validation schemas
 * 
 * Run with: npm test -- lib/validations
 */

describe('Rabbit Validation Schema', () => {
  describe('CreateRabbitSchema', () => {
    it('should validate correct rabbit data', () => {
      const validData = {
        ear_tag_id: 'A-001',
        name: 'Bunny',
        gender: 'Female',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
        status: 'Active',
        source_type: 'Born',
        is_pregnant: false,
      };

      const result = CreateRabbitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with missing ear_tag_id', () => {
      const invalidData = {
        name: 'Bunny',
        gender: 'Female',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should fail with invalid gender', () => {
      const invalidData = {
        ear_tag_id: 'A-001',
        gender: 'Invalid',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid date', () => {
      const invalidData = {
        ear_tag_id: 'A-001',
        gender: 'Female',
        date_of_birth: 'not-a-date',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid ObjectId', () => {
      const invalidData = {
        ear_tag_id: 'A-001',
        gender: 'Female',
        date_of_birth: '2024-01-15',
        breed_id: 'invalid-id',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional name as null', () => {
      const validData = {
        ear_tag_id: 'A-001',
        name: null,
        gender: 'Female',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default status to Kit', () => {
      const data = {
        ear_tag_id: 'A-001',
        gender: 'Female',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('Kit');
      }
    });

    it('should default is_pregnant to false', () => {
      const data = {
        ear_tag_id: 'A-001',
        gender: 'Male',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
      };

      const result = CreateRabbitSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_pregnant).toBe(false);
      }
    });
  });

  describe('UpdateRabbitSchema', () => {
    it('should allow partial updates', () => {
      const partialData = {
        name: 'Updated Bunny',
        status: 'Weaner',
      };

      const result = UpdateRabbitSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow empty update', () => {
      const emptyData = {};

      const result = UpdateRabbitSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });
  });

  describe('RabbitQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      const query = {
        page: '1',
        limit: '20',
      };

      const result = RabbitQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should apply defaults when empty', () => {
      const result = RabbitQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('date_of_birth');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should fail with page less than 1', () => {
      const query = { page: '0' };

      const result = RabbitQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should fail with limit greater than 100', () => {
      const query = { limit: '101' };

      const result = RabbitQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should accept valid search term', () => {
      const query = { search: 'A-001' };

      const result = RabbitQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should accept valid status filter', () => {
      const query = { status: 'Active' };

      const result = RabbitQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });
});

describe('Breed Validation Schema', () => {
  describe('CreateBreedSchema', () => {
    it('should validate correct breed data', () => {
      const validData = {
        name: 'New Zealand White',
        description: 'Large meat rabbit',
        average_mature_weight_kg: 5.5,
        maturity_age_days: 150,
        weaning_age_days: 30,
        grower_age_days: 60,
      };

      const result = CreateBreedSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with missing required fields', () => {
      const invalidData = {
        name: 'Californian',
      };

      const result = CreateBreedSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with negative weight', () => {
      const invalidData = {
        name: 'Breed',
        average_mature_weight_kg: -5,
        maturity_age_days: 150,
        weaning_age_days: 30,
        grower_age_days: 60,
      };

      const result = CreateBreedSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional description as null', () => {
      const validData = {
        name: 'Breed',
        description: null,
        average_mature_weight_kg: 5,
        maturity_age_days: 150,
        weaning_age_days: 30,
        grower_age_days: 60,
      };

      const result = CreateBreedSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateBreedSchema', () => {
    it('should allow partial breed updates', () => {
      const partialData = {
        description: 'Updated description',
        average_mature_weight_kg: 6,
      };

      const result = UpdateBreedSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Cage Validation Schema', () => {
  describe('CreateCageSchema', () => {
    it('should validate correct cage data', () => {
      const validData = {
        name: 'A1',
        location_area: 'Tier A',
        capacity: 5,
        cage_type: 'Doe',
      };

      const result = CreateCageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid cage_type', () => {
      const invalidData = {
        name: 'A1',
        location_area: 'Tier A',
        capacity: 5,
        cage_type: 'InvalidType',
      };

      const result = CreateCageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with zero capacity', () => {
      const invalidData = {
        name: 'A1',
        location_area: 'Tier A',
        capacity: 0,
        cage_type: 'Doe',
      };

      const result = CreateCageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid cage types', () => {
      const types = ['Buck', 'Doe', 'Grower', 'Quarantine', 'Nesting'];

      types.forEach((type) => {
        const data = {
          name: `Cage-${type}`,
          location_area: 'Test',
          capacity: 5,
          cage_type: type,
        };

        const result = CreateCageSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('UpdateCageSchema', () => {
    it('should allow partial cage updates', () => {
      const partialData = {
        capacity: 10,
        location_area: 'Tier B',
      };

      const result = UpdateCageSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});
