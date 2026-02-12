# Backend Implementation Guide - Rabbits Management System

## 📋 Overview

This guide documents the complete backend system built for the rabbits management page in the SunguraSmart farm management application. The implementation follows Next.js 16 best practices with full TypeScript support, Clerk authentication, Zod validation, and MongoDB persistence.

---

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Next.js 16 with App Router
- **ORM**: Mongoose 8.x for MongoDB
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **Validation**: Zod
- **Language**: TypeScript 5.x
- **Monitoring**: PostHog (optional)

### Directory Structure

```
app/
├── api/
│   ├── rabbits/
│   │   ├── route.ts           # Main CRUD endpoints for rabbits
│   │   └── new-route.ts       # Enhanced implementation with full validation
│   ├── breeds/
│   │   └── route.ts           # CRUD endpoints for breeds
│   └── cages/
│       └── route.ts           # CRUD endpoints for cages
lib/
├── mongodb.ts                  # Cached MongoDB connection
├── api-error-handler.ts        # Standardized error handling
├── api-client.ts               # Client-side API wrapper
└── validations/
    ├── rabbit.ts               # Zod schemas for rabbit validation
    ├── breed.ts                # Zod schemas for breed validation
    └── cage.ts                 # Zod schemas for cage validation
hooks/
└── useApi.ts                   # React hooks for API interactions
database/
├── rabbit.model.ts             # Mongoose schema for rabbits
├── breed.model.ts              # Mongoose schema for breeds
├── cage.model.ts               # Mongoose schema for cages
└── types.ts                    # TypeScript interfaces
```

---

## 🔑 Key Features

### 1. **Secure Authentication**
- All mutating endpoints (POST, PUT, DELETE) require Clerk authentication
- User-level data isolation - users can only access their own data
- Automatic authorization checks in API handlers

### 2. **Comprehensive Validation**
- Zod schemas for all request bodies and query parameters
- Inline validation with clear error messages
- Support for partial updates (PUT requests)

### 3. **Robust Error Handling**
- Standardized error response format
- Detailed validation error reporting
- MongoDB duplicate key error handling
- HTTP status codes (400, 401, 403, 404, 409, 500)

### 4. **Pagination & Filtering**
- Cursor-based pagination (page/limit)
- Full-text search support
- Sorting by multiple fields
- Type-safe query parameters

### 5. **Data Relationships**
- Proper MongoDB ObjectId references
- Population of related entities
- Cascade delete considerations (soft deletes recommended for breeding records)

---

## 📡 API Endpoints

### Rabbits

#### GET /api/rabbits
Fetch all rabbits with pagination, filtering, and sorting.

**Query Parameters:**
```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 20, Max: 100
  status?: string;            // Filter by status
  gender?: 'Male' | 'Female'; // Filter by gender
  breed_id?: string;          // Filter by breed
  search?: string;            // Search in ear_tag_id and name
  sortBy?: 'ear_tag_id' | 'date_of_birth' | 'status' | 'gender' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ear_tag_id": "A-001",
      "name": "Bunny",
      "gender": "Female",
      "date_of_birth": "2024-01-15T00:00:00Z",
      "status": "Active",
      "is_pregnant": false,
      "breed": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "New Zealand White"
      },
      "cage": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "A1",
        "cage_type": "Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### POST /api/rabbits
Create a new rabbit.

**Request Body:**
```json
{
  "ear_tag_id": "A-002",
  "name": "Fluffy",
  "gender": "Female",
  "date_of_birth": "2024-01-15",
  "breed_id": "507f1f77bcf86cd799439012",
  "current_cage_id": "507f1f77bcf86cd799439013",
  "status": "Kit",
  "source_type": "Born",
  "is_pregnant": false
}
```

**Response:** (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "ear_tag_id": "A-002",
  "name": "Fluffy",
  "gender": "Female",
  "date_of_birth": "2024-01-15T00:00:00Z",
  "status": "Kit",
  "is_pregnant": false,
  "breed": {...},
  "cage": {...},
  "message": "Rabbit created successfully"
}
```

#### PUT /api/rabbits/[id]
Update an existing rabbit.

**Request Body (Partial):**
```json
{
  "name": "Fluffy Updated",
  "status": "Weaner",
  "is_pregnant": true
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "ear_tag_id": "A-002",
  "name": "Fluffy Updated",
  "status": "Weaner",
  "is_pregnant": true,
  "message": "Rabbit updated successfully"
}
```

#### DELETE /api/rabbits/[id]
Delete a rabbit.

**Response:** (200 OK)
```json
{
  "message": "Rabbit deleted successfully",
  "_id": "507f1f77bcf86cd799439014"
}
```

### Breeds

#### GET /api/breeds
Fetch all breeds.

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'average_mature_weight_kg' | 'maturity_age_days' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "New Zealand White",
      "description": "Large meat rabbit breed",
      "average_mature_weight_kg": 5.5,
      "maturity_age_days": 150,
      "weaning_age_days": 30,
      "grower_age_days": 60
    }
  ],
  "pagination": {...}
}
```

#### POST /api/breeds
Create a new breed.

**Request Body:**
```json
{
  "name": "Californian",
  "description": "Medium meat breed",
  "average_mature_weight_kg": 4.5,
  "maturity_age_days": 140,
  "weaning_age_days": 28,
  "grower_age_days": 58
}
```

**Response:** (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "name": "Californian",
  "description": "Medium meat breed",
  "average_mature_weight_kg": 4.5,
  "message": "Breed created successfully"
}
```

#### PUT /api/breeds/[id]
Update an existing breed.

#### DELETE /api/breeds/[id]
Delete a breed.

### Cages

#### GET /api/cages
Fetch all cages.

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  cage_type?: 'Buck' | 'Doe' | 'Grower' | 'Quarantine' | 'Nesting';
  search?: string;
  sortBy?: 'name' | 'location_area' | 'capacity' | 'cage_type' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "A1",
      "location_area": "Tier A",
      "capacity": 5,
      "cage_type": "Doe",
      "current_occupants": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "ear_tag_id": "A-002",
          "name": "Fluffy"
        }
      ],
      "occupancy": 1,
      "available_slots": 4
    }
  ],
  "pagination": {...}
}
```

#### POST /api/cages
Create a new cage.

**Request Body:**
```json
{
  "name": "B1",
  "location_area": "Tier B",
  "capacity": 6,
  "cage_type": "Doe"
}
```

**Response:** (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "name": "B1",
  "location_area": "Tier B",
  "capacity": 6,
  "cage_type": "Doe",
  "current_occupants": [],
  "occupancy": 0,
  "available_slots": 6,
  "message": "Cage created successfully"
}
```

#### PUT /api/cages/[id]
Update an existing cage.

#### DELETE /api/cages/[id]
Delete a cage.

---

## 🔐 Authentication & Authorization

### Clerk Integration

All endpoints use Clerk's `auth()` function to verify user identity:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return createErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
  }
  
  // User is authenticated - use userId for data filtering
}
```

### User Data Isolation

Every document includes a `user_id` field (string from Clerk) to ensure data isolation:

```typescript
// Only return data for authenticated user
const filter = { user_id: userId };
const data = await Model.find(filter);
```

### Authorization Checks

1. **Read operations** - Filter by user_id
2. **Write operations** - Verify user_id matches authenticated user
3. **Update operations** - Verify ownership before modifying
4. **Delete operations** - Verify ownership before deleting

---

## ✅ Validation

### Zod Schemas

All request validation uses Zod for type safety and runtime checking:

#### Rabbit Schema
```typescript
{
  ear_tag_id: string (required, 1-50 chars, unique per user)
  name?: string (max 100 chars)
  gender: 'Male' | 'Female' (required)
  date_of_birth: Date (required)
  breed_id: ObjectId (required, must exist)
  current_cage_id: ObjectId (required, must exist)
  status: 'Kit' | 'Weaner' | 'Grower' | 'Active' | 'Sick' | 'Quarantined' | 'Culled' | 'Deceased' | 'Sold'
  source_type: 'Born' | 'Purchased' | 'Gifted'
  source_farm?: string (max 100 chars)
  parent_doe_id?: ObjectId
  parent_buck_id?: ObjectId
  is_pregnant: boolean
}
```

#### Breed Schema
```typescript
{
  name: string (required, 1-100 chars, unique per user)
  description?: string (max 500 chars)
  average_mature_weight_kg: number (required, positive)
  maturity_age_days: number (required, positive integer)
  weaning_age_days: number (required, positive integer)
  grower_age_days: number (required, positive integer)
}
```

#### Cage Schema
```typescript
{
  name: string (required, 1-50 chars, unique per user)
  location_area: string (required, 1-100 chars)
  capacity: number (required, positive integer)
  cage_type: 'Buck' | 'Doe' | 'Grower' | 'Quarantine' | 'Nesting' (required)
}
```

### Validation Error Response

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "ear_tag_id": ["Ear tag ID is required"],
    "date_of_birth": ["Date of birth must be a valid date"]
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## 🛡️ Error Handling

### Standardized Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {},  // Optional, for validation errors
  "timestamp": "ISO timestamp"
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `BAD_REQUEST` | 400 | Invalid request |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Error Handling in API Routes

```typescript
try {
  // Perform operation
} catch (error) {
  return handleApiError(error);
}
```

The `handleApiError` function automatically:
- Converts Zod errors to structured format
- Handles MongoDB duplicate key errors
- Provides detailed logging
- Returns standardized response

---

## 💾 Data Fetchers (Server-Side)

The `/lib/data-fetcher.ts` file provides server-side data fetching for page components:

```typescript
// Fetch rabbits for table display
const rabbits = await getRabbitsForTable();

// Fetch breeds for form dropdowns
const breeds = await getBreedsForForm();

// Fetch cages for form dropdowns
const cages = await getCagesForForm();
```

These functions call the API routes under the hood or directly query the database, depending on performance requirements.

---

## 🎣 Client-Side Integration

### Using the API Client

```typescript
import { rabbitsApi } from '@/lib/api-client';

// Fetch rabbits with pagination
const response = await rabbitsApi.list({ 
  page: 1, 
  limit: 20,
  gender: 'Female'
});

// Create a rabbit
const newRabbit = await rabbitsApi.create({
  ear_tag_id: 'A-003',
  name: 'Snowy',
  gender: 'Female',
  date_of_birth: '2024-02-01',
  breed_id: 'abc123',
  current_cage_id: 'def456',
  status: 'Kit',
  source_type: 'Born',
  is_pregnant: false
});

// Update a rabbit
const updated = await rabbitsApi.update('rabbit_id', {
  name: 'Snowy Updated',
  status: 'Weaner'
});

// Delete a rabbit
await rabbitsApi.delete('rabbit_id');
```

### Using React Hooks

```typescript
'use client';

import { useRabbitMutations, useRabbitsQuery } from '@/hooks/useApi';

export function MyComponent() {
  // Query rabbits
  const { data, isLoading, error, refetch } = useRabbitsQuery({
    page: 1,
    limit: 20,
    gender: 'Female'
  });

  // Mutations
  const { create, update, delete: deleteRabbit } = useRabbitMutations();

  const handleCreate = async () => {
    try {
      await create.mutate({
        ear_tag_id: 'A-003',
        name: 'Snowy',
        gender: 'Female',
        date_of_birth: '2024-02-01',
        breed_id: 'abc123',
        current_cage_id: 'def456',
        status: 'Kit',
        source_type: 'Born',
        is_pregnant: false
      });

      // Refetch after create
      refetch();
    } catch (error) {
      console.error('Failed to create rabbit:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {/* Your UI here */}
      <button onClick={handleCreate}>Create Rabbit</button>
    </div>
  );
}
```

---

## 📊 Performance Considerations

### Pagination

Always use pagination for large datasets:

```typescript
// Good - paginated
const response = await rabbitsApi.list({ 
  page: 1, 
  limit: 50 
});

// Bad - no limit (could return thousands of records)
const response = await rabbitsApi.list();
```

### Indexing

MongoDB indexes are set up for common queries:

```typescript
// Indexed fields in Rabbit model:
// - user_id
// - status
// - gender
// - breed_id
// - current_cage_id
// - user_id + status
// - user_id + ear_tag_id

// All compound indexes improve query performance
```

### Lean Queries

Server-side data fetchers use `.lean()` for read-only queries:

```typescript
const rabbits = await Rabbit.find(filter)
  .lean()  // Returns plain objects, not Mongoose documents
  .exec();
```

---

## 🧪 Testing

### Unit Test Example

```typescript
import { CreateRabbitSchema } from '@/lib/validations/rabbit';

describe('CreateRabbitSchema', () => {
  it('should validate correct rabbit data', () => {
    const data = {
      ear_tag_id: 'A-001',
      name: 'Bunny',
      gender: 'Female',
      date_of_birth: '2024-01-15',
      breed_id: '507f1f77bcf86cd799439012',
      current_cage_id: '507f1f77bcf86cd799439013',
      status: 'Active',
      source_type: 'Born',
      is_pregnant: false
    };

    expect(() => CreateRabbitSchema.parse(data)).not.toThrow();
  });

  it('should fail with invalid gender', () => {
    const data = {
      ear_tag_id: 'A-001',
      gender: 'Invalid',
      // ... other fields
    };

    expect(() => CreateRabbitSchema.parse(data)).toThrow();
  });
});
```

### Integration Test Example

```typescript
import { POST } from '@/app/api/rabbits/route';

describe('POST /api/rabbits', () => {
  it('should create a rabbit with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/rabbits', {
      method: 'POST',
      body: JSON.stringify({
        ear_tag_id: 'A-001',
        name: 'Bunny',
        gender: 'Female',
        date_of_birth: '2024-01-15',
        breed_id: '507f1f77bcf86cd799439012',
        current_cage_id: '507f1f77bcf86cd799439013',
        status: 'Active',
        source_type: 'Born',
        is_pregnant: false
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

---

## 🚀 Deployment

### Environment Variables

Ensure these are set in your deployment environment:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

### Vercel Deployment

1. Connect your Git repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with `npm run build`

### MongoDB Connection Pooling

The cached connection in `mongodb.ts` ensures optimal connection pooling:

```typescript
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
```

---

## 📈 Scalability

### Handling 1000+ Records

Current implementation handles this efficiently:

1. **Pagination** - Default limit of 20, max 100 records per request
2. **Indexing** - Strategic MongoDB indexes on frequently queried fields
3. **Lean queries** - Minimizes memory footprint
4. **Connection pooling** - Reuses MongoDB connections
5. **Caching** - Consider Redis for frequently accessed data (future enhancement)

### Rate Limiting (Future Enhancement)

```typescript
// Implement rate limiting to prevent abuse
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { success } = await ratelimit.limit(userId);
  
  if (!success) {
    return createErrorResponse(429, 'TOO_MANY_REQUESTS', 'Rate limit exceeded');
  }
  // ...
}
```

---

## 🔄 Webhook Integration (Future)

For real-time updates:

```typescript
// Example: Trigger webhook on rabbit create
export async function POST(req: NextRequest) {
  // ... create rabbit ...
  
  // Notify external services
  await fetch('https://webhook-handler.com/rabbits/created', {
    method: 'POST',
    body: JSON.stringify({ rabbitId, userId, timestamp }),
  });
}
```

---

## 📚 References

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Clerk Documentation](https://clerk.com/docs)
- [Zod Documentation](https://zod.dev)
- [Mongoose Documentation](https://mongoosejs.com)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/core/data-model-design/)

---

## 📝 Summary

This backend implementation provides:

✅ **Secure** - Clerk authentication + user data isolation
✅ **Validated** - Zod schemas for all inputs
✅ **Scalable** - Pagination, indexing, connection pooling
✅ **Robust** - Comprehensive error handling
✅ **TypeScript** - Full type safety
✅ **Production-Ready** - Ready for Vercel deployment

The system is designed to handle 1000+ records efficiently and supports future enhancements like rate limiting, webhooks, and real-time updates.
