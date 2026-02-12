import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Cage as CageModel } from '@/database/cage.model';
import {
  CreateCageSchema,
  UpdateCageSchema,
  CageQuerySchema,
} from '@/lib/validations/cage';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCodes,
  ApiError,
} from '@/lib/api-error-handler';
import mongoose from 'mongoose';

/**
 * GET /api/cages
 * Fetch all cages with pagination, filtering, and sorting
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
    const queryData = CageQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      cage_type: searchParams.get('cage_type') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    });

    // Build filter
    const filter: Record<string, any> = { user_id: userId };

    if (queryData.cage_type) {
      filter.cage_type = queryData.cage_type;
    }

    if (queryData.search) {
      filter.$or = [
        { name: { $regex: queryData.search, $options: 'i' } },
        { location_area: { $regex: queryData.search, $options: 'i' } },
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
    const [cages, total] = await Promise.all([
      CageModel.find(filter)
        .select('name location_area capacity cage_type current_occupants')
        .populate('current_occupants', 'ear_tag_id name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CageModel.countDocuments(filter),
    ]);

    // Transform data for response
    const transformedCages = cages.map((cage: any) => ({
      _id: cage._id.toString(),
      name: cage.name,
      location_area: cage.location_area,
      capacity: cage.capacity,
      cage_type: cage.cage_type,
      current_occupants: cage.current_occupants?.map((r: any) => ({
        _id: r._id.toString(),
        ear_tag_id: r.ear_tag_id,
        name: r.name,
      })) || [],
      occupancy: cage.current_occupants?.length || 0,
      available_slots: cage.capacity - (cage.current_occupants?.length || 0),
    }));

    return createSuccessResponse({
      data: transformedCages,
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
 * POST /api/cages
 * Create a new cage
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
    const validatedData = CreateCageSchema.parse(body);

    // Check for duplicate cage name for this user
    const existingCage = await CageModel.findOne({
      user_id: userId,
      name: validatedData.name,
    });

    if (existingCage) {
      throw new ApiError(
        409,
        ApiErrorCodes.DUPLICATE_ENTRY,
        'A cage with this name already exists'
      );
    }

    // Create cage
    const cage = new CageModel({
      user_id: userId,
      ...validatedData,
      current_occupants: [],
    });

    await cage.save();

    return createSuccessResponse(
      {
        _id: cage._id.toString(),
        name: cage.name,
        location_area: cage.location_area,
        capacity: cage.capacity,
        cage_type: cage.cage_type,
        current_occupants: [],
        occupancy: 0,
        available_slots: cage.capacity,
        message: 'Cage created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/cages/[id]
 * Update an existing cage
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

    // Extract cage ID from URL
    const url = new URL(req.url);
    const cageId = url.pathname.split('/').pop();

    if (!cageId || !mongoose.Types.ObjectId.isValid(cageId)) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid cage ID'
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request
    const validatedData = UpdateCageSchema.parse(body);

    // Find cage and verify ownership
    const cage = await CageModel.findOne({
      _id: new mongoose.Types.ObjectId(cageId),
      user_id: userId,
    });

    if (!cage) {
      throw new ApiError(
        404,
        ApiErrorCodes.NOT_FOUND,
        'Cage not found'
      );
    }

    // Check for duplicate cage name if updating it
    if (validatedData.name && validatedData.name !== cage.name) {
      const existingCage = await CageModel.findOne({
        user_id: userId,
        name: validatedData.name,
        _id: { $ne: cage._id },
      });

      if (existingCage) {
        throw new ApiError(
          409,
          ApiErrorCodes.DUPLICATE_ENTRY,
          'A cage with this name already exists'
        );
      }
    }

    // Update cage
    Object.assign(cage, validatedData);
    await cage.save();

    // Populate and return
    const populatedCage = await cage.populate('current_occupants', 'ear_tag_id name');

    return createSuccessResponse({
      _id: populatedCage._id.toString(),
      name: populatedCage.name,
      location_area: populatedCage.location_area,
      capacity: populatedCage.capacity,
      cage_type: populatedCage.cage_type,
      current_occupants: populatedCage.current_occupants?.map((r: any) => ({
        _id: r._id.toString(),
        ear_tag_id: r.ear_tag_id,
        name: r.name,
      })) || [],
      occupancy: populatedCage.current_occupants?.length || 0,
      available_slots: populatedCage.capacity - (populatedCage.current_occupants?.length || 0),
      message: 'Cage updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/cages/[id]
 * Delete a cage
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

    // Extract cage ID from URL
    const url = new URL(req.url);
    const cageId = url.pathname.split('/').pop();

    if (!cageId || !mongoose.Types.ObjectId.isValid(cageId)) {
      throw new ApiError(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Invalid cage ID'
      );
    }

    // Find and delete cage, verifying ownership
    const cage = await CageModel.findOneAndDelete(
      {
        _id: new mongoose.Types.ObjectId(cageId),
        user_id: userId,
      },
      { new: true }
    );

    if (!cage) {
      throw new ApiError(
        404,
        ApiErrorCodes.NOT_FOUND,
        'Cage not found'
      );
    }

    return createSuccessResponse({
      message: 'Cage deleted successfully',
      _id: cage._id.toString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}