/**
 * Unit tests for the Rabbits API endpoint
 * Tests for GET, POST, PUT, DELETE handlers
 *
 * Run: npm test -- __tests__/api/rabbits/route.test.ts
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/rabbits/route';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Rabbit } from '@/database/rabbit.model';
import { Cage } from '@/database/cage.model';
import { Breeding } from '@/database/breeding.model';
import mongoose from 'mongoose';

// Mock the dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/mongodb');
jest.mock('@/database/rabbit.model');
jest.mock('@/database/cage.model');
jest.mock('@/database/breeding.model');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Rabbits API Route Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    mockConnectDB.mockResolvedValue({} as any);
  });

  describe('GET /api/rabbits', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/rabbits');
      const response = await GET(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return paginated rabbits for authenticated user', async () => {
      const mockRabbits = [
        {
          _id: new mongoose.Types.ObjectId(),
          ear_tag_id: 'A1-001',
          name: 'Bunny',
          gender: 'Female',
          date_of_birth: new Date('2024-01-01'),
          status: 'Active',
          is_pregnant: false,
          breed_id: { name: 'Californian' },
          current_cage_id: { name: 'Cage-1' },
        },
      ];

      (Rabbit.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                      exec: jest.fn().mockResolvedValue(mockRabbits),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (Rabbit.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest('http://localhost:3000/api/rabbits?page=1&limit=20');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
      expect(data.pagination.page).toBe(1);
    });

    it('should filter rabbits by status', async () => {
      const mockRabbits = [];

      (Rabbit.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                      exec: jest.fn().mockResolvedValue(mockRabbits),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (Rabbit.countDocuments as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost:3000/api/rabbits?status=Active');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(0);
    });

    it('should return 400 for invalid query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/rabbits?limit=999');
      const response = await GET(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/rabbits', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'POST',
        body: JSON.stringify({
          ear_tag_id: 'A1-001',
          gender: 'Female',
          date_of_birth: '2024-01-01',
          breed_id: '507f1f77bcf86cd799439011',
          current_cage_id: '507f1f77bcf86cd799439012',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it('should return 409 for duplicate ear_tag_id', async () => {
      (Rabbit.findOne as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      });

      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'POST',
        body: JSON.stringify({
          ear_tag_id: 'A1-001',
          gender: 'Female',
          date_of_birth: '2024-01-01',
          breed_id: '507f1f77bcf86cd799439011',
          current_cage_id: '507f1f77bcf86cd799439012',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.code).toBe('DUPLICATE_ENTRY');
    });

    it('should return 404 if breed does not exist', async () => {
      (Rabbit.findOne as jest.Mock).mockResolvedValue(null);
      (mongoose.model as jest.Mock).mockReturnValue({
        findById: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'POST',
        body: JSON.stringify({
          ear_tag_id: 'A1-001',
          gender: 'Female',
          date_of_birth: '2024-01-01',
          breed_id: '507f1f77bcf86cd799439011',
          current_cage_id: '507f1f77bcf86cd799439012',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Breed not found');
    });

    it('should return 400 if pregnancy is set for male rabbit', async () => {
      (Rabbit.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'POST',
        body: JSON.stringify({
          ear_tag_id: 'A1-001',
          gender: 'Male',
          date_of_birth: '2024-01-01',
          breed_id: '507f1f77bcf86cd799439011',
          current_cage_id: '507f1f77bcf86cd799439012',
          is_pregnant: true,
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Only female rabbits can be pregnant');
    });

    it('should successfully create a new rabbit', async () => {
      const mockBreed = { _id: new mongoose.Types.ObjectId(), name: 'Californian' };
      const mockCage = { _id: new mongoose.Types.ObjectId(), name: 'Cage-1' };
      const newRabbitId = new mongoose.Types.ObjectId();

      (Rabbit.findOne as jest.Mock).mockResolvedValue(null);
      (mongoose.model as jest.Mock).mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockBreed),
      });
      (Cage.findById as jest.Mock).mockResolvedValue(mockCage);

      const mockRabbit = {
        _id: newRabbitId,
        ear_tag_id: 'A1-001',
        name: 'Bunny',
        gender: 'Female',
        status: 'Kit',
        save: jest.fn().mockResolvedValue({
          _id: newRabbitId,
        }),
      };

      (Rabbit as any).mockImplementation(() => mockRabbit);
      (Rabbit.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue({
                _id: newRabbitId,
                ear_tag_id: 'A1-001',
                name: 'Bunny',
                gender: 'Female',
                status: 'Kit',
                breed_id: mockBreed,
                current_cage_id: mockCage,
              }),
            }),
          }),
        }),
      });

      (Cage.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCage);

      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'POST',
        body: JSON.stringify({
          ear_tag_id: 'A1-001',
          name: 'Bunny',
          gender: 'Female',
          date_of_birth: '2024-01-01',
          breed_id: mockBreed._id.toString(),
          current_cage_id: mockCage._id.toString(),
          status: 'Kit',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain('created successfully');
      expect(data.data.tag_id).toBe('A1-001');
    });
  });

  describe('PUT /api/rabbits/:id', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' }),
      });

      const response = await PUT(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 if rabbit ID is not provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' }),
      });

      const response = await PUT(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Rabbit ID is required');
    });

    it('should return 404 if rabbit does not exist', async () => {
      (Rabbit.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' }),
      });

      const response = await PUT(req);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Rabbit not found');
    });

    it('should return 403 if user does not own the rabbit', async () => {
      const mockRabbit = {
        _id: new mongoose.Types.ObjectId(),
        user_id: 'different-user-123',
      };

      (Rabbit.findById as jest.Mock).mockResolvedValue(mockRabbit);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' }),
      });

      const response = await PUT(req);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should successfully update a rabbit', async () => {
      const rabbitId = new mongoose.Types.ObjectId();
      const mockRabbit = {
        _id: rabbitId,
        user_id: 'test-user-123',
        ear_tag_id: 'A1-001',
        status: 'Kit',
        current_cage_id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          _id: rabbitId,
          status: 'Active',
        }),
      };

      (Rabbit.findById as jest.Mock)
        .mockResolvedValueOnce(mockRabbit)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                  _id: rabbitId,
                  ear_tag_id: 'A1-001',
                  status: 'Active',
                  breed_id: { name: 'Californian' },
                  current_cage_id: { name: 'Cage-1' },
                }),
              }),
            }),
          }),
        });

      (Breeding.countDocuments as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=' + rabbitId.toString(), {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' }),
      });

      const response = await PUT(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('updated successfully');
    });
  });

  describe('DELETE /api/rabbits/:id', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439011', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 if rabbit ID is not provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/rabbits', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Rabbit ID is required');
    });

    it('should return 404 if rabbit does not exist', async () => {
      (Rabbit.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439011', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Rabbit not found');
    });

    it('should return 403 if user does not own the rabbit', async () => {
      const mockRabbit = {
        _id: new mongoose.Types.ObjectId(),
        user_id: 'different-user-123',
      };

      (Rabbit.findById as jest.Mock).mockResolvedValue(mockRabbit);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439011', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 400 if rabbit is involved in active breedings', async () => {
      const rabbitId = new mongoose.Types.ObjectId();
      const mockRabbit = {
        _id: rabbitId,
        user_id: 'test-user-123',
        current_cage_id: new mongoose.Types.ObjectId(),
      };

      (Rabbit.findById as jest.Mock).mockResolvedValue(mockRabbit);
      (Breeding.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=' + rabbitId.toString(), {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('CONFLICT');
    });

    it('should successfully delete a rabbit', async () => {
      const rabbitId = new mongoose.Types.ObjectId();
      const mockRabbit = {
        _id: rabbitId,
        user_id: 'test-user-123',
        current_cage_id: new mongoose.Types.ObjectId(),
      };

      (Rabbit.findById as jest.Mock).mockResolvedValue(mockRabbit);
      (Breeding.countDocuments as jest.Mock).mockResolvedValue(0);
      (mongoose.models.Litter.countDocuments as jest.Mock).mockResolvedValue(0);
      (Cage.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      (mongoose.model('Sale').countDocuments as jest.Mock).mockResolvedValue(0);
      (Rabbit.findByIdAndDelete as jest.Mock).mockResolvedValue(mockRabbit);

      const req = new NextRequest('http://localhost:3000/api/rabbits?id=' + rabbitId.toString(), {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('deleted successfully');
    });
  });
});
