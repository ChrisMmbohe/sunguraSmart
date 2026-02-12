# 🚀 Backend API Quick Reference

## Installation

```bash
npm install zod
```

## Environment Setup

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

---

## API Endpoints

### Rabbits

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/rabbits` | List rabbits (paginated) |
| `POST` | `/api/rabbits` | Create rabbit |
| `PUT` | `/api/rabbits/[id]` | Update rabbit |
| `DELETE` | `/api/rabbits/[id]` | Delete rabbit |

### Breeds

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/breeds` | List breeds |
| `POST` | `/api/breeds` | Create breed |
| `PUT` | `/api/breeds/[id]` | Update breed |
| `DELETE` | `/api/breeds/[id]` | Delete breed |

### Cages

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/cages` | List cages |
| `POST` | `/api/cages` | Create cage |
| `PUT` | `/api/cages/[id]` | Update cage |
| `DELETE` | `/api/cages/[id]` | Delete cage |

---

## Query Parameters

### Pagination
```
?page=1&limit=20
```

### Filtering & Search
```
?status=Active&gender=Female&search=A-001&breed_id=507f...
?cage_type=Doe&location_area=Tier%20A
```

### Sorting
```
?sortBy=date_of_birth&sortOrder=desc
?sortBy=name&sortOrder=asc
```

---

## Client-Side Usage

### Using API Client

```typescript
import { rabbitsApi, breedsApi, cagesApi } from '@/lib/api-client';

// List
await rabbitsApi.list({ page: 1, limit: 20, gender: 'Female' });

// Create
await rabbitsApi.create({ ear_tag_id: 'A-001', ... });

// Update
await rabbitsApi.update(id, { name: 'Updated', ... });

// Delete
await rabbitsApi.delete(id);
```

### Using React Hooks

```typescript
import { useRabbitMutations, useBreedsQuery } from '@/hooks/useApi';

// Query
const { data, isLoading, error, refetch } = useRabbitsQuery({ page: 1 });

// Mutations
const { create, update, delete: deleteRabbit } = useRabbitMutations();
await create.mutate(formData);
```

---

## Error Responses

### Format
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { "field": ["error message"] },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (no permission)
- `404` - Not found
- `409` - Conflict (duplicate entry)
- `500` - Server error

---

## Validation Rules

### Rabbit
- `ear_tag_id` - Required, 1-50 chars, unique per user
- `name` - Optional, max 100 chars
- `gender` - Required: 'Male' | 'Female'
- `date_of_birth` - Required, valid ISO date
- `breed_id` - Required, valid MongoDB ObjectId
- `current_cage_id` - Required, valid MongoDB ObjectId
- `status` - Kit, Weaner, Grower, Active, Sick, Quarantined, Culled, Deceased, Sold
- `source_type` - Born, Purchased, Gifted
- `is_pregnant` - Boolean, default false

### Breed
- `name` - Required, 1-100 chars, unique per user
- `description` - Optional, max 500 chars
- `average_mature_weight_kg` - Required, positive number
- `maturity_age_days` - Required, positive integer
- `weaning_age_days` - Required, positive integer
- `grower_age_days` - Required, positive integer

### Cage
- `name` - Required, 1-50 chars, unique per user
- `location_area` - Required, 1-100 chars
- `capacity` - Required, positive integer
- `cage_type` - Buck, Doe, Grower, Quarantine, Nesting

---

## cURL Examples

### Create Rabbit
```bash
curl -X POST http://localhost:3000/api/rabbits \
  -H "Content-Type: application/json" \
  -d '{
    "ear_tag_id": "A-001",
    "name": "Bunny",
    "gender": "Female",
    "date_of_birth": "2024-01-15",
    "breed_id": "507f1f77bcf86cd799439012",
    "current_cage_id": "507f1f77bcf86cd799439013",
    "status": "Active",
    "source_type": "Born",
    "is_pregnant": false
  }'
```

### Get Rabbits
```bash
curl "http://localhost:3000/api/rabbits?page=1&limit=20&gender=Female"
```

### Update Rabbit
```bash
curl -X PUT http://localhost:3000/api/rabbits/507f... \
  -H "Content-Type: application/json" \
  -d '{ "name": "Updated Bunny", "status": "Weaner" }'
```

### Delete Rabbit
```bash
curl -X DELETE http://localhost:3000/api/rabbits/507f...
```

---

## Data Models

### Rabbit
```typescript
{
  _id: string;
  user_id: string;
  ear_tag_id: string;
  name: string | null;
  gender: 'Male' | 'Female';
  date_of_birth: Date;
  breed_id: ObjectId;
  current_cage_id: ObjectId;
  status: RabbitStatus;
  source_type: 'Born' | 'Purchased' | 'Gifted';
  source_farm: string | null;
  parent_doe_id: ObjectId | null;
  parent_buck_id: ObjectId | null;
  is_pregnant: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Breed
```typescript
{
  _id: string;
  user_id: string;
  name: string;
  description: string | null;
  average_mature_weight_kg: number;
  maturity_age_days: number;
  weaning_age_days: number;
  grower_age_days: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cage
```typescript
{
  _id: string;
  user_id: string;
  name: string;
  location_area: string;
  capacity: number;
  cage_type: 'Buck' | 'Doe' | 'Grower' | 'Quarantine' | 'Nesting';
  current_occupants: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## File Locations

### API Routes
- `/app/api/rabbits/route.ts` - Rabbits CRUD
- `/app/api/rabbits/new-route.ts` - Enhanced implementation
- `/app/api/breeds/route.ts` - Breeds CRUD
- `/app/api/cages/route.ts` - Cages CRUD

### Validation
- `/lib/validations/rabbit.ts` - Rabbit schemas
- `/lib/validations/breed.ts` - Breed schemas
- `/lib/validations/cage.ts` - Cage schemas

### Client Integration
- `/lib/api-client.ts` - API wrapper
- `/hooks/useApi.ts` - React hooks

### Database
- `/database/rabbit.model.ts` - Rabbit schema
- `/database/breed.model.ts` - Breed schema
- `/database/cage.model.ts` - Cage schema
- `/lib/mongodb.ts` - Connection

### Utilities
- `/lib/api-error-handler.ts` - Error handling

### Documentation
- `/BACKEND_IMPLEMENTATION_GUIDE.md` - Complete guide
- `/BACKEND_SETUP_GUIDE.md` - Setup instructions
- `/BACKEND_DELIVERY_SUMMARY.md` - Delivery overview

---

## Testing

```bash
# Run validation tests
npm test -- lib/__tests__/validations.test.ts

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## Performance Tips

1. **Always paginate**: Use `?page=1&limit=50` (not all records)
2. **Filter early**: Server-side filtering faster than client filtering
3. **Use proper indexes**: Already set up in MongoDB schemas
4. **Cache when possible**: Consider Redis for frequently accessed data
5. **Monitor with PostHog**: Already integrated in your project

---

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | User not logged in with Clerk |
| 400 Validation Error | Check validation error `details` field |
| 404 Not Found | Resource doesn't exist or user doesn't own it |
| 409 Duplicate Entry | ear_tag_id or name already exists |
| MongoDB timeout | Check IP whitelist in MongoDB Atlas |

---

## Resources

- 📖 [Backend Implementation Guide](./BACKEND_IMPLEMENTATION_GUIDE.md)
- 🚀 [Setup Guide](./BACKEND_SETUP_GUIDE.md)
- 📋 [Delivery Summary](./BACKEND_DELIVERY_SUMMARY.md)
- 🔗 [Clerk Docs](https://clerk.com/docs)
- 📝 [Zod Docs](https://zod.dev)
- 🗄️ [Mongoose Docs](https://mongoosejs.com)

---

**Made with ❤️ for scalable farm management** 🐰🌾
