# Rabbits API - Quick Reference Guide

## File Structure

```
app/api/rabbits/
├── route.ts              # Main API endpoint handlers (GET, POST, PUT, DELETE)
└── [handlers]            # Well-organized CRUD handlers with full validation

lib/
├── validations/
│   └── rabbit.ts         # Zod schemas for form data and query parameters
├── api-error-handler.ts  # Standardized error handling utilities
├── data-fetcher.ts       # Database helper functions (extended with API helpers)
└── mongodb.ts            # Database connection management

__tests__/api/rabbits/
└── route.test.ts         # Jest unit tests for all API handlers

database/
├── rabbit.model.ts       # Mongoose schema and model
├── cage.model.ts
├── breeding.model.ts
└── index.ts              # Model exports
```

## Quick Examples

### Call the API from Frontend

```typescript
// Create a rabbit
const createRabbit = async (data: RabbitFormData) => {
  const response = await fetch('/api/rabbits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Fetch rabbits with filters
const fetchRabbits = async (filters?: { status?: string; gender?: string }) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/rabbits?${params}`);
  return response.json();
};

// Update a rabbit
const updateRabbit = async (id: string, data: Partial<RabbitFormData>) => {
  const response = await fetch(`/api/rabbits?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Delete a rabbit
const deleteRabbit = async (id: string) => {
  const response = await fetch(`/api/rabbits?id=${id}`, {
    method: 'DELETE',
  });
  return response.json();
};
```

### Use Helper Functions in Server Code

```typescript
// In server components or API handlers
import {
  getRabbitsForTable,
  getRabbitById,
  getRabbitStats,
  getBreedingRabbits,
  searchRabbits,
  isEarTagIdUnique,
  hasActiveBreedings,
} from '@/lib/data-fetcher';

// Get rabbits for table view
const rabbits = await getRabbitsForTable();

// Get single rabbit with all populated fields
const rabbit = await getRabbitById(userId, rabbitId);

// Get user's stats
const stats = await getRabbitStats(userId);
// { total: 50, active: 45, bucks: 20, does: 30 }

// Get available does for breeding with a buck
const does = await getBreedingRabbits(userId, 'Male');

// Search rabbits
const results = await searchRabbits(userId, 'A1');

// Validate ear tag uniqueness
const isUnique = await isEarTagIdUnique(userId, 'A1-001');

// Check if rabbit has active breedings
const hasBreedings = await hasActiveBreedings(rabbitId);
```

## Request/Response Patterns

### Success Responses

```json
// GET /api/rabbits
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 },
  "message": "Rabbits fetched successfully"
}

// POST /api/rabbits (201)
{
  "data": { ... },
  "message": "Rabbit created successfully"
}

// PUT /api/rabbits?id=xxx
{
  "data": { ... },
  "message": "Rabbit updated successfully"
}

// DELETE /api/rabbits?id=xxx
{
  "data": { "_id": "xxx" },
  "message": "Rabbit deleted successfully"
}
```

### Error Responses

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-26T10:30:00Z",
  "details": { "field": ["validation message"] }
}
```

## Validation Rules

| Field | Rules |
|-------|-------|
| ear_tag_id | Required, 1-50 chars, unique per user |
| name | Optional, max 100 chars |
| gender | Required, 'Male' or 'Female' |
| date_of_birth | Required, valid date |
| breed_id | Required, valid ObjectId, breed exists |
| current_cage_id | Required, valid ObjectId, cage exists |
| status | One of: Kit, Weaner, Grower, Active, Sick, Quarantined, Culled, Deceased, Sold |
| is_pregnant | Optional, boolean, only for females |
| parent_doe_id | Optional, must be female |
| parent_buck_id | Optional, must be male |

## Business Logic Rules

1. **Unique Identifier**: `ear_tag_id` must be unique per user
2. **Pregnancy**: Only females can be pregnant
3. **Breeding Validation**: Cannot delete or mark terminal if in active breedings
4. **Cage Management**: Moving rabbits updates cage occupancy automatically
5. **Status Progression**: Auto-updated based on age (Kit → Weaner → Grower → Active)
6. **Deletion**: Hard delete if no related records, soft delete otherwise

## Common Use Cases

### Case 1: Create a New Rabbit from Form

```typescript
const handleCreateRabbit = async (formData: RabbitFormData) => {
  try {
    const response = await fetch('/api/rabbits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rabbit');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating rabbit:', error);
    throw error;
  }
};
```

### Case 2: Display Rabbits with Pagination

```typescript
const [rabbits, setRabbits] = useState([]);
const [page, setPage] = useState(1);

const loadRabbits = async (pageNum: number) => {
  const response = await fetch(`/api/rabbits?page=${pageNum}&limit=20`);
  const { data, pagination } = await response.json();
  setRabbits(data);
};
```

### Case 3: Update Rabbit Status

```typescript
const handleStatusChange = async (rabbitId: string, newStatus: string) => {
  const response = await fetch(`/api/rabbits?id=${rabbitId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error);
  }

  const { data } = await response.json();
  return data;
};
```

### Case 4: Delete Rabbit with Validation

```typescript
const handleDeleteRabbit = async (rabbitId: string) => {
  const response = await fetch(`/api/rabbits?id=${rabbitId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const { error, code } = await response.json();
    if (code === 'CONFLICT') {
      // Show warning about active breedings
      alert(`Cannot delete: ${error}`);
      return false;
    }
    throw new Error(error);
  }

  return true;
};
```

## Testing Endpoints

### Using cURL

```bash
# GET rabbits
curl http://localhost:3000/api/rabbits \
  -H "Authorization: Bearer YOUR_TOKEN"

# POST rabbit
curl -X POST http://localhost:3000/api/rabbits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"ear_tag_id":"A1-001","gender":"Female",...}'

# PUT update
curl -X PUT http://localhost:3000/api/rabbits?id=RABBIT_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"Active"}'

# DELETE
curl -X DELETE http://localhost:3000/api/rabbits?id=RABBIT_ID
```

## Debugging Tips

1. **Check Authentication**: Verify Clerk token is valid
2. **Validate Input**: Ensure all required fields are provided with correct types
3. **Check Database Connection**: Verify MONGODB_URI is set and valid
4. **Review Logs**: Check server console for detailed error messages
5. **Use Browser DevTools**: Inspect network requests and responses
6. **Run Tests**: Use Jest tests to validate functionality

## Performance Notes

- Maximum 100 items per page (query limit parameter)
- Uses lean queries for read-only operations
- Implements pagination to limit memory usage
- Database indexes on frequently queried fields
- Selective field selection to minimize data transfer
