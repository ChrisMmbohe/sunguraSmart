import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Breed as BreedModel } from '@/database/breed.model';
import {
  CreateBreedSchema,
  UpdateBreedSchema,
  BreedQuerySchema,
} from '@/lib/validations/breed';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCodes,
  ApiError,
} from '@/lib/api-error-handler';
import mongoose from 'mongoose';

/**
 * GET /api/breeds
 * Fetch all breeds with pagination, filtering, and sorting
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        401,
        ApiErrorCodes.UNAUTHORIZED,
        'Authentication required'
      );
    }

    await connectDB();

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryData = BreedQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    });

    // Build filter
    const filter: Record<string, any> = { user_id: userId };

    if (queryData.search) {
      filter.$or = [
        { name: { $regex: queryData.search, $options: 'i' } },
        { description: { $regex: queryData.search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    sort[queryData.sortBy] = queryData.sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const page = queryData.page;
    const limit = queryData.limit;
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [breeds, total] = await Promise.all([
      BreedModel.find(filter)
        .select('name description average_mature_weight_kg maturity_age_days weaning_age_days grower_age_days')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      BreedModel.countDocuments(filter),
    ]);

    // Transform data for response
    const transformedBreeds = breeds.map((breed: any) => ({
      _id: breed._id.toString(),
      name: breed.name,
      description: breed.description,
      average_mature_weight_kg: breed.average_mature_weight_kg,
      maturity_age_days: breed.maturity_age_days,
      weaning_age_days: breed.weaning_age_days,
      grower_age_days: breed.grower_age_days,
    }));

    return createSuccessResponse({
      data: transformedBreeds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/breeds
 * Create a new breed
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        401,
        ApiErrorCodes.UNAUTHORIZED,
        'Authentication required'
      );
    }

    await connectDB();

    // Parse request body
    const body = await req.json();

    // Validate request
    const validatedData = CreateBreedSchema.parse(body);

    // Check for duplicate breed name for this user
    const existingBreed = await BreedModel.findOne({
      user_id: userId,
      name: validatedData.name,
    });

    if (existingBreed) {
      throw new ApiError(
        409,
        ApiErrorCodes.DUPLICATE_ENTRY,
        'A breed with this name already exists'
      );
    }

    // Create breed
    const breed = new BreedModel({
      user_id: userId,
      ...validatedData,
    });

    await breed.save();

    return createSuccessResponse(
      {
        _id: breed._id.toString(),
        name: breed.name,
        description: breed.description,
        average_mature_weight_kg: breed.average_mature_weight_kg,
        maturity_age_days: breed.maturity_age_days,
        weaning_age_days: breed.weaning_age_days,
        grower_age_days: breed.grower_age_days,
        message: 'Breed created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/breeds/[id]
 * Update an existing breed
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        401,
        ApiErrorCodes.UNAUTHORIZED,
        'Authentication required'
      );
    }

    await connectDB();

    // Extract breed ID from URL
    const url = new URL(req.url);
    const breedId = url.pathname.split('/').pop();

    if (!breedId || !mongoose.Types.ObjectId.isValid(breedId)) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid breed ID'
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request
    const validatedData = UpdateBreedSchema.parse(body);

    // Find breed and verify ownership
    const breed = await BreedModel.findOne({
      _id: new mongoose.Types.ObjectId(breedId),
      user_id: userId,
    });

    if (!breed) {
      throw new ApiError(
        404,
        ApiErrorCodes.NOT_FOUND,
        'Breed not found'
      );
    }

    // Check for duplicate breed name if updating it
    if (validatedData.name && validatedData.name !== breed.name) {
      const existingBreed = await BreedModel.findOne({
        user_id: userId,
        name: validatedData.name,
        _id: { $ne: breed._id },
      });

      if (existingBreed) {
        throw new ApiError(
          409,
          ApiErrorCodes.DUPLICATE_ENTRY,
          'A breed with this name already exists'
        );
      }
    }

    // Update breed
    Object.assign(breed, validatedData);
    await breed.save();

    return createSuccessResponse({
      _id: breed._id.toString(),
      name: breed.name,
      description: breed.description,
      average_mature_weight_kg: breed.average_mature_weight_kg,
      maturity_age_days: breed.maturity_age_days,
      weaning_age_days: breed.weaning_age_days,
      grower_age_days: breed.grower_age_days,
      message: 'Breed updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/breeds/[id]
 * Delete a breed
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        401,
        ApiErrorCodes.UNAUTHORIZED,
        'Authentication required'
      );
    }

    await connectDB();

    // Extract breed ID from URL
    const url = new URL(req.url);
    const breedId = url.pathname.split('/').pop();

    if (!breedId || !mongoose.Types.ObjectId.isValid(breedId)) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid breed ID'
      );
    }

    // Find and delete breed, verifying ownership
    const breed = await BreedModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(breedId),
        user_id: userId,
      },
      { new: true }
    );

    if (!breed) {
      throw new ApiError(
        404,
        ApiErrorCodes.NOT_FOUND,
        'Breed not found'
      );
    }

    return createSuccessResponse({
      message: 'Breed deleted successfully',
      _id: breed._id.toString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}