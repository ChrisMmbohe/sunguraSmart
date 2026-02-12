/**
 * RABBITS API BACKEND IMPLEMENTATION GUIDE
 * 
 * This document provides complete documentation for the Rabbits API endpoints
 * including setup, usage, security, and integration guidelines.
 */

# Rabbits API Backend Implementation

## Overview

The Rabbits API provides secure, efficient CRUD operations for managing rabbits in the farm management system. Built with Next.js 14+, MongoDB, Mongoose, Clerk authentication, and Zod validation.

## API Endpoints

### GET /api/rabbits
Fetch rabbits with filtering, pagination, and sorting

**Authentication**: Required (Clerk)

**Query Parameters**:
- `page` (string): Page number, default: "1", minimum: 1
- `limit` (string): Items per page, default: "20", minimum: 1, maximum: 100
- `status` (string): Filter by status (Kit, Weaner, Grower, Active, Sick, Quarantined, Culled, Deceased, Sold)
- `gender` (string): Filter by gender (Male, Female)
- `breed_id` (string): Filter by breed MongoDB ID
- `search` (string): Search by ear_tag_id or name
- `sortBy` (string): Sort field (ear_tag_id, date_of_birth, status, gender, createdAt), default: "date_of_birth"
- `sortOrder` (string): Sort direction (asc, desc), default: "desc"

**Response** (200 OK):
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "tag_id": "A1-001",
      "full_name": "A1-001 - Bunny",
      "gender": "Female",
      "age_in_days": 180,
      "status": "Active",
      "is_pregnant": false,
      "breed_name": "Californian",
      "cage_id": "Cage-1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "message": "Rabbits fetched successfully"
}
```

**Error Responses**:
- `401 UNAUTHORIZED`: Missing authentication
- `400 VALIDATION_ERROR`: Invalid query parameters
- `500 INTERNAL_SERVER_ERROR`: Server error

---

### POST /api/rabbits
Create a new rabbit

**Authentication**: Required (Clerk)

**Request Body**:
```json
{
  "ear_tag_id": "A1-001",
  "name": "Bunny",
  "gender": "Female",
  "date_of_birth": "2024-01-01",
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
    "cage_id": "Cage-1"
  },
  "message": "Rabbit created successfully"
}
```

**Validations**:
- `ear_tag_id`: Required, max 50 characters, must be unique per user
- `gender`: Required, must be 'Male' or 'Female'
- `date_of_birth`: Required, valid date
- `breed_id`: Required, valid MongoDB ObjectId, breed must exist
- `current_cage_id`: Required, valid MongoDB ObjectId, cage must exist
- `is_pregnant`: Only females can be pregnant
- `parent_doe_id`: Must be female rabbit if provided
- `parent_buck_id`: Must be male rabbit if provided

**Error Responses**:
- `401 UNAUTHORIZED`: Missing authentication
- `409 DUPLICATE_ENTRY`: Ear tag ID already exists for user
- `400 VALIDATION_ERROR`: Validation failed
- `404 NOT_FOUND`: Breed or cage not found
- `500 INTERNAL_SERVER_ERROR`: Server error

---

### PUT /api/rabbits/:id
Update an existing rabbit

**Authentication**: Required (Clerk)

**URL Parameters**:
- `id` (query): Rabbit MongoDB ID

**Request Body** (all fields optional):
```json
{
  "name": "Bunny Updated",
  "status": "Active",
  "current_cage_id": "507f1f77bcf86cd799439012",
  "is_pregnant": true
}
```

**Response** (200 OK):
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "tag_id": "A1-001",
    "full_name": "A1-001 - Bunny Updated",
    "gender": "Female",
    "status": "Active",
    "is_pregnant": true,
    "breed_name": "Californian",
    "cage_id": "Cage-1"
  },
  "message": "Rabbit updated successfully"
}
```

**Side Effects**:
- Cage occupancy is automatically updated if `current_cage_id` changes
- Cannot change status to terminal (Culled, Deceased, Sold) if rabbit has active breedings
- Status change to pregnant only allowed for females

**Error Responses**:
- `401 UNAUTHORIZED`: Missing authentication
- `403 FORBIDDEN`: User doesn't own the rabbit
- `404 NOT_FOUND`: Rabbit not found
- `400 CONFLICT`: Cannot perform update due to business logic conflict
- `400 VALIDATION_ERROR`: Validation failed
- `500 INTERNAL_SERVER_ERROR`: Server error

---

### DELETE /api/rabbits/:id
Delete a rabbit with validation checks

**Authentication**: Required (Clerk)

**URL Parameters**:
- `id` (query): Rabbit MongoDB ID

**Response** (200 OK):
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439013"
  },
  "message": "Rabbit deleted successfully"
}
```

**Deletion Rules**:
- Hard delete: If rabbit has no related records (Sales, Culls, Deaths)
- Soft delete: Mark as 'Deceased' if rabbit has related records
- Cannot delete: If rabbit is involved in active breedings or litters

**Error Responses**:
- `401 UNAUTHORIZED`: Missing authentication
- `403 FORBIDDEN`: User doesn't own the rabbit
- `404 NOT_FOUND`: Rabbit not found
- `400 CONFLICT`: Cannot delete due to active breedings/litters
- `500 INTERNAL_SERVER_ERROR`: Server error

---

## Helper Functions (lib/data-fetcher.ts)

### isEarTagIdUnique(userId, earTagId, excludeId?)
Check if an ear_tag_id is unique for a user

```typescript
const isUnique = await isEarTagIdUnique('user_123', 'A1-001');
```

### getRabbitById(userId, rabbitId)
Get rabbit details with fully populated references

```typescript
const rabbit = await getRabbitById('user_123', '507f1f77bcf86cd799439013');
```

### getRabbitStats(userId)
Get rabbit statistics (total, active, bucks, does)

```typescript
const stats = await getRabbitStats('user_123');
// { total: 50, active: 45, bucks: 20, does: 30 }
```

### getBreedingRabbits(userId, gender)
Get available rabbits for breeding

```typescript
const does = await getBreedingRabbits('user_123', 'Male');
// Returns active female rabbits available for breeding with bucks
```

### searchRabbits(userId, searchTerm, limit?)
Search rabbits by ear_tag_id or name

```typescript
const results = await searchRabbits('user_123', 'A1', 10);
```

### getRabbitCountByStatus(userId)
Count rabbits by status

```typescript
const counts = await getRabbitCountByStatus('user_123');
// { Active: 30, Kit: 10, Weaner: 5, ... }
```

### hasActiveBreedings(rabbitId)
Check if rabbit is involved in active breedings

```typescript
const hasBreedings = await hasActiveBreedings('507f1f77bcf86cd799439013');
```

---

## Security Features

1. **Authentication**: All endpoints require Clerk authentication
2. **Authorization**: Users can only access/modify their own rabbits
3. **Data Validation**: Zod schema validation on all inputs
4. **Input Sanitization**: Automatic trimming and validation of strings
5. **Error Handling**: Consistent error responses without sensitive info exposure
6. **Rate Limiting**: Compatible with Next.js rate limiting middleware
7. **CORS**: Handled by Next.js default configuration

---

## Integration with Frontend

### Fetch Examples

**GET Rabbits**:
```typescript
const response = await fetch('/api/rabbits?page=1&limit=20&status=Active');
const { data, pagination } = await response.json();
```

**CREATE Rabbit**:
```typescript
const response = await fetch('/api/rabbits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ear_tag_id: 'A1-001',
    gender: 'Female',
    date_of_birth: '2024-01-01',
    breed_id: 'breed_id_here',
    current_cage_id: 'cage_id_here',
  }),
});
const { data } = await response.json();
```

**UPDATE Rabbit**:
```typescript
const response = await fetch('/api/rabbits?id=rabbit_id_here', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'Active' }),
});
const { data } = await response.json();
```

**DELETE Rabbit**:
```typescript
const response = await fetch('/api/rabbits?id=rabbit_id_here', {
  method: 'DELETE',
});
const { data } = await response.json();
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-26T10:30:00Z",
  "details": {
    "field_name": ["Validation message"]
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `DUPLICATE_ENTRY`: Unique constraint violated
- `CONFLICT`: Business logic conflict
- `BAD_REQUEST`: Malformed request
- `INTERNAL_SERVER_ERROR`: Server error

---

## Performance Optimization

1. **Lean Queries**: Uses `.lean()` for read-only queries
2. **Selective Field Selection**: Only fetches required fields
3. **Pagination**: Limits results to 100 items maximum
4. **Indexing**: Database indexes on user_id, ear_tag_id, status, gender
5. **Caching**: Frontend can cache responses appropriately

---

## Testing

Run the test suite:
```bash
npm test -- __tests__/api/rabbits/route.test.ts
```

Tests cover:
- Authentication validation
- CRUD operations
- Validation rules
- Error handling
- Authorization checks
- Business logic validations

---

## Database Schema

**Rabbit Model**:
- `user_id`: String (indexed)
- `ear_tag_id`: String (unique, indexed)
- `name`: String (optional)
- `gender`: String (Male/Female)
- `date_of_birth`: Date
- `status`: String (multiple statuses)
- `is_pregnant`: Boolean
- `breed_id`: ObjectId (ref: 'Breed')
- `current_cage_id`: ObjectId (ref: 'Cage')
- `parent_doe_id`: ObjectId (optional)
- `parent_buck_id`: ObjectId (optional)
- `source_type`: String (Born/Purchased/Gifted)
- `source_farm`: String (optional)
- `timestamps`: createdAt, updatedAt

---

## Environment Variables

Required in `.env.local`:
```
MONGODB_URI=mongodb://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## Future Enhancements

1. Bulk operations (create/update/delete multiple rabbits)
2. Export functionality (CSV, PDF)
3. Advanced filtering and aggregation
4. Webhook events for rabbit status changes
5. Rate limiting per user
6. Activity logging
