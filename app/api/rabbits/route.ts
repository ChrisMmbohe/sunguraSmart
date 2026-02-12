import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Rabbit as RabbitModel } from '@/database/rabbit.model';
import { Breed as BreedModel } from '@/database/breed.model';
import { Cage as CageModel } from '@/database/cage.model';
import {
  CreateRabbitSchema,
  UpdateRabbitSchema,
  RabbitQuerySchema,
  type RabbitQueryParams,
} from '@/lib/validations/rabbit';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCodes,
  ApiError,
} from '@/lib/api-error-handler';
import mongoose from 'mongoose';

/**
 * GET /api/rabbits
 * Fetch all rabbits with pagination, filtering, and sorting
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
    const queryData = RabbitQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      gender: searchParams.get('gender') || undefined,
      breed_id: searchParams.get('breed_id') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'date_of_birth',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    // Build filter
    const filter: Record<string, any> = { user_id: userId };
    
    if (queryData.status) {
      filter.status = queryData.status;
    }
    
    if (queryData.gender) {
      filter.gender = queryData.gender;
    }
    
    if (queryData.breed_id) {
      filter.breed_id = new mongoose.Types.ObjectId(queryData.breed_id);
    }
    
    if (queryData.search) {
      filter.$or = [
        { ear_tag_id: { $regex: queryData.search, $options: 'i' } },
        { name: { $regex: queryData.search, $options: 'i' } },
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
    const [rabbits, total] = await Promise.all([
      RabbitModel.find(filter)
        .select('ear_tag_id name gender date_of_birth status is_pregnant breed_id current_cage_id')
        .populate('breed_id', 'name')
        .populate('current_cage_id', 'name cage_type')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      RabbitModel.countDocuments(filter),
    ]);

    // Transform data for response
    const transformedRabbits = rabbits.map((rabbit: any) => ({
      _id: rabbit._id.toString(),
      ear_tag_id: rabbit.ear_tag_id,
      name: rabbit.name,
      gender: rabbit.gender,
      date_of_birth: rabbit.date_of_birth,
      status: rabbit.status,
      is_pregnant: rabbit.is_pregnant,
      breed: rabbit.breed_id
        ? {
            _id: rabbit.breed_id._id.toString(),
            name: rabbit.breed_id.name,
          }
        : null,
      cage: rabbit.current_cage_id
        ? {
            _id: rabbit.current_cage_id._id.toString(),
            name: rabbit.current_cage_id.name,
            cage_type: rabbit.current_cage_id.cage_type,
          }
        : null,
    }));

    return createSuccessResponse({
      data: transformedRabbits,
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
 * POST /api/rabbits
 * Create a new rabbit
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
    const validatedData = CreateRabbitSchema.parse(body);

    // Verify breed exists
    const breed = await BreedModel.findById(validatedData.breed_id);
    if (!breed) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid breed ID: breed does not exist'
      );
    }

    // Verify cage exists
    const cage = await CageModel.findById(validatedData.current_cage_id);
    if (!cage) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid cage ID: cage does not exist'
      );
    }

    // Check for duplicate ear_tag_id for this user
    const existingRabbit = await RabbitModel.findOne({
      user_id: userId,
      ear_tag_id: validatedData.ear_tag_id,
    });

    if (existingRabbit) {
      throw new ApiError(
        409,
        ApiErrorCodes.DUPLICATE_ENTRY,
        'A rabbit with this ear tag ID already exists'
      );
    }

    // Create rabbit
    const rabbit = new RabbitModel({
      user_id: userId,
      ...validatedData,
      breed_id: new mongoose.Types.ObjectId(validatedData.breed_id),
      current_cage_id: new mongoose.Types.ObjectId(validatedData.current_cage_id),
      parent_doe_id: validatedData.parent_doe_id
        ? new mongoose.Types.ObjectId(validatedData.parent_doe_id)
        : null,
      parent_buck_id: validatedData.parent_buck_id
        ? new mongoose.Types.ObjectId(validatedData.parent_buck_id)
        : null,
    });

    await rabbit.save();

    // Populate and return
    const populatedRabbit = await rabbit.populate([
      { path: 'breed_id', select: 'name' },
      { path: 'current_cage_id', select: 'name cage_type' },
    ]);

    return createSuccessResponse(
      {
        _id: populatedRabbit._id.toString(),
        ear_tag_id: populatedRabbit.ear_tag_id,
        name: populatedRabbit.name,
        gender: populatedRabbit.gender,
        date_of_birth: populatedRabbit.date_of_birth,
        status: populatedRabbit.status,
        is_pregnant: populatedRabbit.is_pregnant,
        breed: populatedRabbit.breed_id,
        cage: populatedRabbit.current_cage_id,
        message: 'Rabbit created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/rabbits/[id]
 * Update an existing rabbit
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

    // Extract rabbit ID from URL
    const url = new URL(req.url);
    const rabbitId = url.pathname.split('/').pop();

    if (!rabbitId || !mongoose.Types.ObjectId.isValid(rabbitId)) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid rabbit ID'
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request
    const validatedData = UpdateRabbitSchema.parse(body);

    // Find rabbit and verify ownership
    const rabbit = await RabbitModel.findOne({
      _id: new mongoose.Types.ObjectId(rabbitId),
      user_id: userId,
    });

    if (!rabbit) {
      throw new ApiError(
        404,
        ApiErrorCodes.NOT_FOUND,
        'Rabbit not found'
      );
    }

    // Verify breed if provided
    if (validatedData.breed_id) {
      const breed = await BreedModel.findById(validatedData.breed_id);
      if (!breed) {
        throw new ApiError(
          400,
          ApiErrorCodes.BAD_REQUEST,
          'Invalid breed ID: breed does not exist'
        );
      }
    }

    // Verify cage if provided
    if (validatedData.current_cage_id) {
      const cage = await CageModel.findById(validatedData.current_cage_id);
      if (!cage) {
        throw new ApiError(
          400,
          ApiErrorCodes.BAD_REQUEST,
          'Invalid cage ID: cage does not exist'
        );
      }
    }

    // Check for duplicate ear_tag_id if updating it
    if (validatedData.ear_tag_id && validatedData.ear_tag_id !== rabbit.ear_tag_id) {
      const existingRabbit = await RabbitModel.findOne({
        user_id: userId,
        ear_tag_id: validatedData.ear_tag_id,
        _id: { $ne: rabbit._id },
      });

      if (existingRabbit) {
        throw new ApiError(
          409,
          ApiErrorCodes.DUPLICATE_ENTRY,
          'A rabbit with this ear tag ID already exists'
        );
      }
    }

    // Update rabbit
    Object.assign(rabbit, {
      ...validatedData,
      breed_id: validatedData.breed_id
        ? new mongoose.Types.ObjectId(validatedData.breed_id)
        : rabbit.breed_id,
      current_cage_id: validatedData.current_cage_id
        ? new mongoose.Types.ObjectId(validatedData.current_cage_id)
        : rabbit.current_cage_id,
      parent_doe_id: validatedData.parent_doe_id
        ? new mongoose.Types.ObjectId(validatedData.parent_doe_id)
        : rabbit.parent_doe_id,
      parent_buck_id: validatedData.parent_buck_id
        ? new mongoose.Types.ObjectId(validatedData.parent_buck_id)
        : rabbit.parent_buck_id,
    });

    await rabbit.save();

    // Populate and return
    const populatedRabbit = await rabbit.populate([
      { path: 'breed_id', select: 'name' },
      { path: 'current_cage_id', select: 'name cage_type' },
    ]);

    return createSuccessResponse({
      _id: populatedRabbit._id.toString(),
      ear_tag_id: populatedRabbit.ear_tag_id,
      name: populatedRabbit.name,
      gender: populatedRabbit.gender,
      date_of_birth: populatedRabbit.date_of_birth,
      status: populatedRabbit.status,
      is_pregnant: populatedRabbit.is_pregnant,
      breed: populatedRabbit.breed_id,
      cage: populatedRabbit.current_cage_id,
      message: 'Rabbit updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rabbits/[id]
 * Delete a rabbit
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

    // Extract rabbit ID from URL
    const url = new URL(req.url);
    const rabbitId = url.pathname.split('/').pop();

    if (!rabbitId || !mongoose.Types.ObjectId.isValid(rabbitId)) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid rabbit ID'
      );
    }

    // Find and delete rabbit, verifying ownership
    const rabbit = await RabbitModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(rabbitId),
        user_id: userId,
      },
      { new: true }
    );

    if (!rabbit) {
      throw new ApiError(
        404,
        ApiErrorCodes.NOT_FOUND,
        'Rabbit not found'
      );
    }

    return createSuccessResponse({
      message: 'Rabbit deleted successfully',
      _id: rabbit._id.toString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
