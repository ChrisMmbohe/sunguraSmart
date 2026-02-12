# Rabbit Management Backend Implementation

## Overview

The rabbit management backend is fully implemented with comprehensive CRUD operations, validation, error handling, and Clerk authentication integration. The system handles creation, updating, retrieval, and deletion of rabbit records with extensive business logic validation.

---

## Architecture Components

### 1. **Rabbit Mongoose Model** ([database/rabbit.model.ts](database/rabbit.model.ts))

The Rabbit model implements comprehensive schema and business logic for rabbit data management.

#### Schema Fields:
- **user_id** (String): Clerk user ID for multi-tenancy - indexed
- **ear_tag_id** (String, Unique): Unique identifier for each rabbit (e.g., "A1-001") - indexed for performance
- **name** (String, Optional): Friendly name (e.g., "Bunny")
- **gender** (Enum): 'Male' | 'Female' - indexed for efficient filtering
- **date_of_birth** (Date): Required for age calculations
- **breed_id** (ObjectId): Reference to Breed model
- **current_cage_id** (ObjectId): Reference to Cage model - indexed for cage queries
- **status** (Enum): 'Kit' | 'Weaner' | 'Grower' | 'Active' | 'Sick' | 'Quarantined' | 'Culled' | 'Deceased' | 'Sold' - indexed
- **source_type** (Enum): 'Born' | 'Purchased' | 'Gifted'
- **source_farm** (String, Optional): Seller or gifting farm info
- **parent_doe_id** (ObjectId, Optional): Reference to mother rabbit - indexed
- **parent_buck_id** (ObjectId, Optional): Reference to father rabbit
- **is_pregnant** (Boolean): Pregnancy status (default: false)
- **timestamps**: createdAt, updatedAt (automatic)

#### Virtual Fields:
- **age_in_days**: Calculated from date_of_birth (read-only)
- **full_name**: Combined ear_tag_id and name (read-only)
- **maturity_status**: 'Immature' | 'Growing' | 'Mature' | 'N/A' (read-only)

#### Static Methods:
- **getStats(userId)**: Returns statistics for rabbit dashboard
  - Counts: total, active, bucks (males), does (females)
  - Filters out terminal statuses automatically

#### Pre-Save Middleware:
- Automatic status progression based on age
- Growth stages: Kit (0-30) → Weaner (30-60) → Grower (60-150) → Active (150+)
- Respects breed-specific maturity ages
- Preserves manual statuses like 'Sick', 'Quarantined'

#### Indexes:
- `user_id` + `status` (common filtering combination)
- `user_id` + `ear_tag_id` (unique constraint support)
- Individual indexes on: gender, breed_id, current_cage_id, parent_doe_id

---

### 2. **Validation Schema** ([lib/validations/rabbit.ts](lib/validations/rabbit.ts))

Uses Zod for runtime validation with clear error messages:

#### RabbitFormSchema:
- **ear_tag_id**: Required, 1-50 characters
- **name**: Optional, max 100 characters
- **gender**: Required, enum 'Male' | 'Female'
- **date_of_birth**: Required, valid ISO date string
- **breed_id**: Required, valid MongoDB ObjectId format (24 hex chars)
- **current_cage_id**: Required, valid MongoDB ObjectId format
- **status**: Optional, defaults to 'Kit'
- **source_type**: Optional, defaults to 'Born'
- **source_farm**: Optional, max 100 characters
- **parent_doe_id**: Optional, valid ObjectId if provided
- **parent_buck_id**: Optional, valid ObjectId if provided
- **is_pregnant**: Optional boolean, defaults to false

#### Specialized Schemas:
- **CreateRabbitSchema**: For POST requests (same as RabbitFormSchema)
- **UpdateRabbitSchema**: For PUT requests (all fields optional)
- **RabbitQuerySchema**: For GET query parameters (pagination, filtering, sorting)

---

### 3. **API Routes** ([app/api/rabbits/route.ts](app/api/rabbits/route.ts))

#### GET /api/rabbits - Retrieve Rabbits
**Authentication**: Required (Clerk)

**Query Parameters**:
- `page` (string): Page number (default: 1, min: 1)
- `limit` (string): Items per page (default: 20, max: 100)
- `status` (string): Filter by rabbit status
- `gender` (string): Filter by gender ('Male' | 'Female')
- `breed_id` (string): Filter by breed ID
- `search` (string): Search term for ear_tag_id or name
- `sortBy` (string): Sort field (default: 'date_of_birth')
  - Options: 'ear_tag_id', 'date_of_birth', 'status', 'gender', 'createdAt'
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')

**Response** (200 OK):
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "tag_id": "A1-001",
      "full_name": "A1-001 - Bunny",
      "gender": "Female",
      "age_in_days": 120,
      "status": "Grower",
      "is_pregnant": false,
      "breed_name": "Californian",
      "cage_id": "A1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "message": "Rabbits fetched successfully"
}
```

**Error Responses**:
- 401: Not authenticated
- 400: Invalid query parameters (Zod validation)

---

#### POST /api/rabbits - Create Rabbit
**Authentication**: Required (Clerk)

**Request Body**:
```json
{
  "ear_tag_id": "A1-001",
  "name": "Bunny",
  "gender": "Female",
  "date_of_birth": "2024-06-15",
  "breed_id": "507f1f77bcf86cd799439011",
  "current_cage_id": "507f1f77bcf86cd799439012",
  "status": "Kit",
  "source_type": "Born",
  "source_farm": null,
  "parent_doe_id": null,
  "parent_buck_id": null,
  "is_pregnant": false
}
```

**Validation & Business Logic**:
1. ✅ Zod schema validation
2. ✅ Duplicate ear_tag_id check (per user)
3. ✅ Breed existence validation
4. ✅ Cage existence validation
5. ✅ Parent doe/buck gender validation (if provided)
6. ✅ Pregnancy status only for females
7. ✅ Automatic cage occupancy update
8. ✅ Auto-status calculation from age (via pre-save middleware)

**Response** (201 Created):
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "tag_id": "A1-001",
    "full_name": "A1-001 - Bunny",
    "gender": "Female",
    "status": "Kit",
    "breed_name": "Californian",
    "cage_id": "A1"
  },
  "message": "Rabbit created successfully"
}
```

**Error Responses**:
- 400: Validation failed, invalid breed/cage ID format
- 401: Not authenticated
- 404: Breed or Cage not found
- 409: Duplicate ear_tag_id
- 500: Database error

---

#### PUT /api/rabbits - Update Rabbit
**Authentication**: Required (Clerk)
**Authorization**: User must own the rabbit

**Query Parameters**:
- `id` (required): Rabbit MongoDB ObjectId

**Request Body** (All fields optional):
```json
{
  "name": "Updated Bunny",
  "status": "Active",
  "is_pregnant": true,
  "current_cage_id": "507f1f77bcf86cd799439014"
}
```

**Validation & Business Logic**:
1. ✅ Verify rabbit ownership
2. ✅ Partial schema validation (UpdateRabbitSchema)
3. ✅ Breed/Cage existence checks (if provided)
4. ✅ Cage occupancy management (if cage changed)
5. ✅ Parent rabbit validation (if provided)
6. ✅ Pregnancy status validation
7. ✅ Terminal status conflict checks:
   - Cannot mark as Culled/Deceased/Sold if in active breeding
8. ✅ Preserve auto-status if modifying other fields

**Response** (200 OK):
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "tag_id": "A1-001",
    "full_name": "A1-001 - Updated Bunny",
    "gender": "Female",
    "status": "Active",
    "is_pregnant": true,
    "breed_name": "Californian",
    "cage_id": "A1"
  },
  "message": "Rabbit updated successfully"
}
```

**Error Responses**:
- 400: Validation failed, invalid IDs, or pregnancy/status conflicts
- 401: Not authenticated
- 403: Not authorized (don't own rabbit)
- 404: Rabbit not found or referenced resources not found
- 409: Cannot update due to active breedings

---

#### DELETE /api/rabbits - Delete Rabbit
**Authentication**: Required (Clerk)
**Authorization**: User must own the rabbit

**Query Parameters**:
- `id` (required): Rabbit MongoDB ObjectId

**Validation & Business Logic**:
1. ✅ Verify rabbit ownership
2. ✅ Check for active breedings (prevent deletion)
3. ✅ Check for active litters (prevent deletion)
4. ✅ Soft delete: Mark as 'Deceased' if related records exist
5. ✅ Hard delete: Remove document if no related records
6. ✅ Update cage occupancy

**Response** (200 OK):
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439013"
  },
  "message": "Rabbit deleted successfully"
}
```

**Error Responses**:
- 400: Invalid ID format
- 401: Not authenticated
- 403: Not authorized
- 404: Rabbit not found
- 409: Cannot delete due to active breedings/litters

---

### 4. **Error Handling** ([lib/api-error-handler.ts](lib/api-error-handler.ts))

Standardized error responses for consistent API behavior:

#### Error Codes:
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): User lacks permission
- `NOT_FOUND` (404): Resource doesn't exist
- `VALIDATION_ERROR` (400): Zod validation failed
- `DUPLICATE_ENTRY` (409): Duplicate unique field
- `BAD_REQUEST` (400): Invalid input format
- `CONFLICT` (409): Business logic conflict
- `INTERNAL_SERVER_ERROR` (500): Server error

#### Error Response Format:
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field_name": ["Error message 1", "Error message 2"]
  },
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

#### Features:
- ✅ Zod validation error formatting
- ✅ MongoDB duplicate key error handling
- ✅ Mongoose validation error handling
- ✅ Connection error detection
- ✅ Generic error fallback
- ✅ Console logging for debugging

---

### 5. **Database Connection** ([lib/mongodb.ts](lib/mongodb.ts))

Global connection caching for Next.js hot-reload environments:

**Features**:
- ✅ Singleton connection pattern
- ✅ Promise-based caching to prevent multiple connections
- ✅ Automatic model registration on connection
- ✅ Graceful error handling with retry capability
- ✅ BufferCommands disabled for better error messages

**Connection Flow**:
1. Check for cached connection → return
2. Check for pending connection promise → wait
3. Create new connection and cache promise
4. Load all models via initModels()
5. Cache and return connection

---

### 6. **Model Registration** ([database/index.ts](database/index.ts))

All models are exported and explicitly registered via initModels():

**Included Models**:
- Breed, Cage, Disease, FeedType, FeedLog
- **Rabbit**, Weight, HealthRecord
- Litter, Breeding, Schedule, Sale, Expense
- Cull, Death

**initModels() Function**:
- Forces all model files to load
- Ensures Mongoose schema registration
- Called automatically on database connection
- Prevents "ModelNotRegistered" errors in hot-reload

---

### 7. **Frontend Integration** ([components/RabbitForm.tsx](components/RabbitForm.tsx))

Form component expects API at `/api/rabbits`:

#### Form Data Interface:
```typescript
interface RabbitFormData {
  ear_tag_id: string;
  name: string;
  gender: 'Male' | 'Female';
  date_of_birth: string; // ISO date
  breed_id: string;
  current_cage_id: string;
  status: string;
  source_type: 'Born' | 'Purchased' | 'Gifted';
  is_pregnant: boolean;
}
```

#### Integration Points:
- **onSubmit** prop: Receives validated form data
- **isLoading** prop: For handling async operations
- **initialData** prop: For edit mode (pre-fills form)
- **breeds** prop: Array of `IBreedOption` for dropdown
- **cages** prop: Array of `ICageOption` for dropdown

---

## Complete Data Flow

### Creating a Rabbit (New Record):
```
RabbitForm
  ↓ (form submission with validated data)
POST /api/rabbits
  ↓
Clerk Auth Check ✓
  ↓
Connect to MongoDB
  ↓
Zod Validation
  ↓
Duplicate Check (ear_tag_id)
  ↓
Breed Existence Check ✓
  ↓
Cage Existence Check ✓
  ↓
Parent Rabbit Validation ✓
  ↓
Pregnancy Status Check ✓
  ↓
Create Rabbit Document
  ↓
Pre-Save Middleware:
  - Calculate age
  - Determine auto-status
  ↓
Update Cage Occupancy
  ↓
Populate References
  ↓
Return 201 with Rabbit Data
```

### Updating a Rabbit (Existing Record):
```
RabbitForm (with initialData)
  ↓ (partial form update)
PUT /api/rabbits?id=ObjectId
  ↓
Clerk Auth Check ✓
  ↓
Connect to MongoDB
  ↓
Zod Validation (partial schema)
  ↓
Ownership Verification ✓
  ↓
Reference Validation (if changed)
  ↓
Cage Occupancy Update (if cage changed)
  ↓
Terminal Status Conflict Check ✓
  ↓
Apply Updates to Document
  ↓
Pre-Save Middleware:
  - Recalculate age
  - Update auto-status if needed
  ↓
Populate References
  ↓
Return 200 with Updated Rabbit Data
```

---

## Key Features & Validations

### 1. **Unique Identifier (ear_tag_id)**
- ✅ Unique within user scope
- ✅ Cannot be duplicated
- ✅ Indexed for fast lookups
- ✅ Scalable pattern (e.g., "D-DOEID-SEQ", "YYYYMM-SEQ")

### 2. **Automatic Age-Based Status**
- ✅ Pre-save middleware calculates age in days
- ✅ Progression: Kit → Weaner → Grower → Active
- ✅ Uses breed-specific maturity ages
- ✅ Respects manual overrides (Sick, Quarantined)

### 3. **Referential Integrity**
- ✅ Breed exists before assignment
- ✅ Cage exists before assignment
- ✅ Parent rabbits must be correct gender
- ✅ Cascade updates to cage occupancy

### 4. **Business Logic Validations**
- ✅ Only females can be pregnant
- ✅ Cannot delete rabbit in active breeding
- ✅ Cannot delete rabbit with active litters
- ✅ Cannot mark as terminal if in active breeding
- ✅ Proper soft/hard delete based on related records

### 5. **Multi-Tenancy**
- ✅ Clerk authentication required for all endpoints
- ✅ user_id stored with each record
- ✅ All queries filtered by user_id
- ✅ Ownership verification on updates/deletes

### 6. **Performance Optimization**
- ✅ Strategic indexes on common queries
- ✅ Lean queries for list endpoints (no unnecessary virtuals)
- ✅ Pagination support (default 20, max 100)
- ✅ Efficient sorting and filtering

---

## Environment Configuration

**Required Environment Variables** (.env.local):
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## Example Usage

### Create a New Rabbit
```typescript
const response = await fetch('/api/rabbits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ear_tag_id: 'A1-001',
    name: 'Bunny',
    gender: 'Female',
    date_of_birth: '2024-06-15',
    breed_id: '507f1f77bcf86cd799439011',
    current_cage_id: '507f1f77bcf86cd799439012',
    status: 'Kit',
    source_type: 'Born',
    is_pregnant: false
  })
});
const rabbit = await response.json();
console.log(rabbit.data._id); // New rabbit ID
```

### Update Rabbit Status
```typescript
const response = await fetch('/api/rabbits?id=507f1f77bcf86cd799439013', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'Active',
    is_pregnant: true
  })
});
const updated = await response.json();
```

### Query Rabbits with Filters
```typescript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  status: 'Active',
  gender: 'Female',
  sortBy: 'date_of_birth',
  sortOrder: 'asc'
});
const response = await fetch(`/api/rabbits?${params}`);
const { data, pagination } = await response.json();
```

---

## Testing Checklist

- [x] Create rabbit with all required fields
- [x] Create rabbit with minimal fields (name optional)
- [x] Prevent duplicate ear_tag_id
- [x] Validate breed_id exists
- [x] Validate cage_id exists
- [x] Validate date format and age calculation
- [x] Verify only females can be pregnant
- [x] Update rabbit status
- [x] Update cage (verify occupancy transfer)
- [x] Delete rabbit (check for active breedings)
- [x] List rabbits with pagination
- [x] Filter by status, gender, breed
- [x] Search by ear_tag_id and name
- [x] Verify user isolation (multi-tenancy)
- [x] Test error responses and validation messages

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (RabbitForm)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├─→ POST /api/rabbits (Create)
                         ├─→ GET /api/rabbits (Retrieve)
                         ├─→ PUT /api/rabbits?id=X (Update)
                         └─→ DELETE /api/rabbits?id=X (Delete)
                         │
┌────────────────────────┴────────────────────────────────────┐
│             API Route Handler (route.ts)                    │
│  ├─ Clerk Auth Middleware                                  │
│  ├─ connectDB() - MongoDB Connection                       │
│  ├─ Zod Validation                                         │
│  └─ Business Logic & Error Handling                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│            Mongoose Models & Middleware                     │
│  ├─ RabbitSchema with Virtuals                             │
│  ├─ Pre-Save Hooks (Auto-status calculation)               │
│  ├─ Breed Model (Maturity age metadata)                    │
│  ├─ Cage Model (Occupancy tracking)                        │
│  └─ Related Models (Litter, Breeding, etc.)                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              MongoDB Database                               │
│  ├─ rabbits collection                                     │
│  ├─ breeds collection                                      │
│  ├─ cages collection                                       │
│  └─ Related collections                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

The rabbit management backend is production-ready with:
- ✅ Complete CRUD operations
- ✅ Comprehensive validation
- ✅ Business logic enforcement
- ✅ Multi-tenancy support
- ✅ Error handling
- ✅ Performance optimization
- ✅ Clear API contracts
- ✅ Mongoose schema best practices

All endpoints are integrated with Clerk authentication and properly handle edge cases with meaningful error responses.
