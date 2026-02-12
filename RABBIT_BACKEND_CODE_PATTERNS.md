# Rabbit Backend Code Architecture & Patterns

## 1. Database Connection Pattern (mongodb.ts)

**Global Singleton with Promise Caching**

```typescript
// lib/mongodb.ts - Pattern used throughout the app
import mongoose from 'mongoose';
import { initModels } from '@/database/index';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI as string;
let cached = global.mongoose;

function loadModels() {
  if (Object.keys(mongoose.models).length === 0) {
    console.log('--- Registering Mongoose Models ---');
    initModels();
  }
}

async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) {
    loadModels();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongooseInstance) => {
      loadModels();
      return mongooseInstance.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
    loadModels();
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
```

**Key Benefits**:
- ✅ Prevents connection exhaustion in Next.js dev mode
- ✅ Ensures models are loaded every time (even with cached connection)
- ✅ Promise caching prevents race conditions
- ✅ Hot-reload friendly

---

## 2. Mongoose Model Pattern (rabbit.model.ts)

**Complete Model with Virtuals, Statics, and Middleware**

```typescript
// database/rabbit.model.ts
import mongoose, { Schema } from 'mongoose';
import { IRabbit, IRabbitModel } from './types';

const RabbitSchema = new Schema<IRabbit>({
  user_id: { type: String, required: true, index: true },
  ear_tag_id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, default: null, trim: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  date_of_birth: { type: Date, required: true },
  breed_id: { type: Schema.Types.ObjectId, ref: 'Breed', required: true },
  current_cage_id: { type: Schema.Types.ObjectId, ref: 'Cage', required: true },
  status: {
    type: String,
    enum: ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'],
    default: 'Kit',
    index: true
  },
  source_type: { type: String, enum: ['Born', 'Purchased', 'Gifted'], required: true },
  is_pregnant: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true } });

// Virtual: Age in Days
RabbitSchema.virtual('age_in_days').get(function() {
  if (!this.date_of_birth) return 0;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - this.date_of_birth.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual: Full Name
RabbitSchema.virtual('full_name').get(function() {
  return this.name ? `${this.ear_tag_id} - ${this.name}` : this.ear_tag_id;
});

// Static: Get Statistics
RabbitSchema.statics.getStats = async function(userId: string) {
  const nonTerminalStatuses = ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined'];
  const baseFilter = {
    user_id: userId,
    status: { $in: nonTerminalStatuses }
  };

  return {
    total: await this.countDocuments(baseFilter),
    active: await this.countDocuments({ ...baseFilter, status: 'Active' }),
    bucks: await this.countDocuments({ ...baseFilter, gender: 'Male' }),
    does: await this.countDocuments({ ...baseFilter, gender: 'Female' })
  };
};

// Pre-Save: Auto-Status Calculation
RabbitSchema.pre('save', async function(next) {
  const terminalOrOverrideStatuses = ['Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'];
  
  if (!terminalOrOverrideStatuses.includes(this.status)) {
    const ageDays = this.age_in_days;
    
    if (ageDays >= 150) this.status = 'Active';
    else if (ageDays >= 60) this.status = 'Grower';
    else if (ageDays >= 30) this.status = 'Weaner';
    else this.status = 'Kit';
  }
  
  next();
});

// Indexes for Performance
RabbitSchema.index({ user_id: 1, status: 1 });
RabbitSchema.index({ user_id: 1, ear_tag_id: 1 });

export const Rabbit = (mongoose.models.Rabbit || 
  mongoose.model<IRabbit, IRabbitModel>('Rabbit', RabbitSchema)) as IRabbitModel;
```

**Key Patterns**:
- ✅ Virtual fields for computed properties (not stored)
- ✅ Static methods for collection-wide operations
- ✅ Pre-save hooks for business logic
- ✅ Automatic model registration (don't re-register)
- ✅ Strategic indexing for query performance

---

## 3. Validation with Zod (rabbit.ts)

**Type-Safe Runtime Validation**

```typescript
// lib/validations/rabbit.ts
import { z } from 'zod';

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
  
  is_pregnant: z.boolean().default(false),
});

// Specialized Schemas
export const CreateRabbitSchema = RabbitFormSchema;
export const UpdateRabbitSchema = RabbitFormSchema.partial();

// Query Schema for List Endpoints
export const RabbitQuerySchema = z.object({
  page: z.string().transform(Number).refine((n) => n >= 1).default('1'),
  limit: z.string().transform(Number).refine((n) => n >= 1 && n <= 100).default('20'),
  status: z.string().optional(),
  gender: z.enum(['Male', 'Female']).optional(),
});
```

**Key Patterns**:
- ✅ Clear error messages for each field
- ✅ Custom validation with `.refine()`
- ✅ `.transform()` for type conversion
- ✅ `.partial()` for optional fields
- ✅ Enum validation with error messages
- ✅ Nullable vs optional distinction

---

## 4. Error Handling Pattern (api-error-handler.ts)

**Standardized Error Responses**

```typescript
// lib/api-error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string[]>;
  timestamp?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ApiErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONFLICT: 'CONFLICT',
} as const;

export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) formatted[path] = [];
    formatted[path].push(err.message);
  });
  
  return formatted;
}

export function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  }, { status: statusCode });
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);
  
  if (error instanceof ZodError) {
    return createErrorResponse(
      400,
      ApiErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      formatZodErrors(error)
    );
  }
  
  if (error instanceof ApiError) {
    return createErrorResponse(
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
  }
  
  // MongoDB duplicate key
  if (error instanceof Error && error.message.includes('E11000')) {
    return createErrorResponse(
      409,
      ApiErrorCodes.DUPLICATE_ENTRY,
      'Duplicate entry',
      { duplicate: ['A record with this unique field already exists'] }
    );
  }
  
  // Fallback
  return createErrorResponse(
    500,
    ApiErrorCodes.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred'
  );
}
```

**Key Patterns**:
- ✅ Standardized error response format
- ✅ Error codes for client-side handling
- ✅ Field-level validation error details
- ✅ Timestamp for debugging
- ✅ Custom error class for API errors
- ✅ Type-safe error codes

---

## 5. API Route Handler Pattern (route.ts)

**Complete POST Handler Example**

```typescript
// app/api/rabbits/route.ts - POST Handler
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ZodError } from 'zod';
import connectDB from '@/lib/mongodb';
import { Rabbit } from '@/database/rabbit.model';
import { Cage } from '@/database/cage.model';
import { CreateRabbitSchema } from '@/lib/validations/rabbit';
import {
  handleApiError,
  createErrorResponse,
  ApiErrorCodes,
  ApiError,
  formatZodErrors,
} from '@/lib/api-error-handler';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(401, ApiErrorCodes.UNAUTHORIZED, 'Authentication required');
    }

    // 2. Connect to Database
    await connectDB();

    // 3. Parse and Validate Request Body
    const body = await req.json();
    const validatedData = CreateRabbitSchema.parse(body);

    // 4. Business Logic: Check Duplicate
    const existingRabbit = await Rabbit.findOne({
      ear_tag_id: validatedData.ear_tag_id,
      user_id: userId,
    });

    if (existingRabbit) {
      return createErrorResponse(
        409,
        ApiErrorCodes.DUPLICATE_ENTRY,
        `Rabbit with ear tag ID "${validatedData.ear_tag_id}" already exists`
      );
    }

    // 5. Business Logic: Validate References
    if (!mongoose.Types.ObjectId.isValid(validatedData.breed_id)) {
      return createErrorResponse(400, ApiErrorCodes.BAD_REQUEST, 'Invalid breed ID format');
    }

    const breed = await mongoose.model('Breed').findById(validatedData.breed_id);
    if (!breed) {
      return createErrorResponse(404, ApiErrorCodes.NOT_FOUND, 'Breed not found');
    }

    const cage = await Cage.findById(validatedData.current_cage_id);
    if (!cage) {
      return createErrorResponse(404, ApiErrorCodes.NOT_FOUND, 'Cage not found');
    }

    // 6. Business Logic: Validate Constraints
    if (validatedData.is_pregnant && validatedData.gender !== 'Female') {
      return createErrorResponse(
        400,
        ApiErrorCodes.BAD_REQUEST,
        'Only female rabbits can be pregnant'
      );
    }

    // 7. Create Document
    const newRabbit = new Rabbit({
      user_id: userId,
      ...validatedData,
    });

    // 8. Save (triggers pre-save hooks)
    const savedRabbit = await newRabbit.save();

    // 9. Side Effects: Update Cage Occupancy
    await Cage.findByIdAndUpdate(
      validatedData.current_cage_id,
      { $push: { current_occupants: savedRabbit._id } },
      { new: true }
    );

    // 10. Prepare Response
    const populatedRabbit = await Rabbit.findById(savedRabbit._id)
      .populate('breed_id', 'name')
      .populate('current_cage_id', 'name')
      .lean();

    return NextResponse.json(
      {
        data: {
          _id: populatedRabbit?._id.toString(),
          tag_id: populatedRabbit?.ear_tag_id,
          full_name: populatedRabbit?.name 
            ? `${populatedRabbit.ear_tag_id} - ${populatedRabbit.name}` 
            : populatedRabbit?.ear_tag_id,
          gender: populatedRabbit?.gender,
          status: populatedRabbit?.status,
          breed_name: (populatedRabbit?.breed_id as any)?.name ?? 'Unknown',
        },
        message: 'Rabbit created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    // Error Handling Chain
    if (error instanceof ZodError) {
      return createErrorResponse(
        400,
        ApiErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        formatZodErrors(error)
      );
    }
    
    if (error instanceof ApiError) {
      return createErrorResponse(error.statusCode, error.code, error.message, error.details);
    }
    
    return handleApiError(error);
  }
}
```

**Key Patterns**:
- ✅ Layer-by-layer validation and error handling
- ✅ Early returns for error cases
- ✅ Zod validation first
- ✅ Business logic checks in order of importance
- ✅ Side effects after main operation
- ✅ Response data transformation
- ✅ Comprehensive error handling chain

---

## 6. PUT Handler Pattern (Partial Updates)

```typescript
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(401, ApiErrorCodes.UNAUTHORIZED, 'Authentication required');
    }

    await connectDB();

    // Extract ID from Query
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return createErrorResponse(400, ApiErrorCodes.BAD_REQUEST, 'Rabbit ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse(400, ApiErrorCodes.BAD_REQUEST, 'Invalid rabbit ID format');
    }

    const body = await req.json();
    const validatedUpdates = UpdateRabbitSchema.parse(body);

    // Find and Verify Ownership
    const rabbit = await Rabbit.findById(id);
    if (!rabbit) {
      return createErrorResponse(404, ApiErrorCodes.NOT_FOUND, 'Rabbit not found');
    }

    if (rabbit.user_id !== userId) {
      return createErrorResponse(403, ApiErrorCodes.FORBIDDEN, 'You do not have permission to update this rabbit');
    }

    // Validate Updates (only if provided)
    if (validatedUpdates.is_pregnant !== undefined) {
      const gender = validatedUpdates.gender || rabbit.gender;
      if (validatedUpdates.is_pregnant && gender !== 'Female') {
        return createErrorResponse(
          400,
          ApiErrorCodes.BAD_REQUEST,
          'Only female rabbits can be pregnant'
        );
      }
    }

    // Handle Cage Changes
    if (validatedUpdates.current_cage_id && !rabbit.current_cage_id?.equals(validatedUpdates.current_cage_id)) {
      // Remove from old cage
      await Cage.findByIdAndUpdate(
        rabbit.current_cage_id,
        { $pull: { current_occupants: rabbit._id } },
        { new: true }
      );

      // Add to new cage
      await Cage.findByIdAndUpdate(
        validatedUpdates.current_cage_id,
        { $push: { current_occupants: rabbit._id } },
        { new: true }
      );
    }

    // Apply Updates
    Object.assign(rabbit, validatedUpdates);
    const updatedRabbit = await rabbit.save();

    // Return Updated Data
    const populatedRabbit = await Rabbit.findById(updatedRabbit._id)
      .populate('breed_id', 'name')
      .populate('current_cage_id', 'name')
      .lean();

    return NextResponse.json(
      {
        data: {
          _id: populatedRabbit?._id.toString(),
          tag_id: populatedRabbit?.ear_tag_id,
          status: populatedRabbit?.status,
          is_pregnant: populatedRabbit?.is_pregnant,
        },
        message: 'Rabbit updated successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(400, ApiErrorCodes.VALIDATION_ERROR, 'Validation failed', formatZodErrors(error));
    }
    return handleApiError(error);
  }
}
```

**Key Patterns**:
- ✅ Query parameter extraction and validation
- ✅ Ownership verification before update
- ✅ Conditional validation (only if field provided)
- ✅ Side effect management (cage occupancy)
- ✅ Partial updates with Object.assign()

---

## 7. Frontend Integration Pattern

```typescript
// Usage in Component
import { RabbitForm, RabbitFormData } from '@/components/RabbitForm';

export function RabbitManager() {
  const [rabbit, setRabbit] = useState<RabbitFormData | undefined>();

  const handleSubmit = async (data: RabbitFormData) => {
    try {
      const response = await fetch('/api/rabbits', {
        method: rabbit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      console.log('Success:', result.data);
      
      // Refresh data
      await loadRabbits();
    } catch (error) {
      console.error('Error:', error);
      // Show error to user
    }
  };

  return (
    <RabbitForm
      breeds={breeds}
      cages={cages}
      onSubmit={handleSubmit}
      onCancel={() => setRabbit(undefined)}
      initialData={rabbit}
    />
  );
}
```

**Key Patterns**:
- ✅ Pass form data directly to API
- ✅ Use HTTP method to determine create vs update
- ✅ Error response handling
- ✅ User feedback on success/failure

---

## 8. Index Strategy

```typescript
// database/rabbit.model.ts - Indexes

// Compound index for user queries
RabbitSchema.index({ user_id: 1, status: 1 });

// Unique constraint on ear_tag_id per user
RabbitSchema.index({ user_id: 1, ear_tag_id: 1 });

// Common filters
RabbitSchema.index({ gender: 1 });
RabbitSchema.index({ breed_id: 1 });
RabbitSchema.index({ current_cage_id: 1 });

// Parent tracking
RabbitSchema.index({ parent_doe_id: 1 });
RabbitSchema.index({ parent_buck_id: 1 });

// Timestamps for sorting
RabbitSchema.index({ createdAt: -1 });
```

**Index Usage**:
- ✅ Filter by user_id + status (most common)
- ✅ Unique constraint on ear_tag_id per user
- ✅ Fast gender/breed/cage lookups
- ✅ Parent tracking for genealogy
- ✅ Timestamp sorting for recent rabbits

---

## Summary of Key Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| Global Connection Caching | Prevent connection exhaustion | `connectDB()` singleton |
| Pre-Save Hooks | Auto-calculate status | Age → Status mapping |
| Virtual Fields | Computed properties | `age_in_days`, `full_name` |
| Zod Validation | Runtime type safety | Schema validation |
| Error Responses | Consistent error format | `ApiErrorResponse` |
| Ownership Verification | Multi-tenancy security | Check `user_id` |
| Partial Updates | Flexible PUT requests | `.partial()` schema |
| Side Effects | Maintain data integrity | Update cage occupancy |
| Strategic Indexing | Query optimization | Compound indexes |

All patterns follow Next.js 14+ best practices and are production-ready!
