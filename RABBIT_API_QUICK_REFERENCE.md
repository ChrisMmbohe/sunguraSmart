# Rabbit Backend API Quick Reference

## API Endpoints

### GET /api/rabbits
Fetch rabbits with pagination, filtering, and sorting.

**Query Parameters:**
```
page=1&limit=20&status=Active&gender=Female&breed_id=XXX&search=A1&sortBy=date_of_birth&sortOrder=desc
```

**Response (200):**
```json
{
  "data": [{"_id":"", "tag_id":"", "full_name":"", "gender":"", "age_in_days":120, "status":"", "is_pregnant":false, "breed_name":"", "cage_id":""}],
  "pagination": {"page":1, "limit":20, "total":45, "totalPages":3},
  "message": "Rabbits fetched successfully"
}
```

---

### POST /api/rabbits
Create a new rabbit record.

**Request:**
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

**Response (201):**
```json
{
  "data": {"_id":"", "tag_id":"A1-001", "full_name":"A1-001 - Bunny", "gender":"Female", "status":"Kit", "breed_name":"Californian", "cage_id":"A1"},
  "message": "Rabbit created successfully"
}
```

**Validations:**
- ✅ ear_tag_id is unique per user
- ✅ breed_id exists and is valid
- ✅ current_cage_id exists and is valid
- ✅ parent_doe_id must be Female (if provided)
- ✅ parent_buck_id must be Male (if provided)
- ✅ is_pregnant only for Female gender
- ✅ Status auto-calculated from age

---

### PUT /api/rabbits?id=ObjectId
Update an existing rabbit.

**Query Parameters:**
```
id=507f1f77bcf86cd799439013 (required)
```

**Request (all fields optional):**
```json
{
  "name": "Updated Name",
  "status": "Active",
  "is_pregnant": true,
  "current_cage_id": "507f1f77bcf86cd799439014"
}
```

**Response (200):**
```json
{
  "data": {"_id":"", "tag_id":"A1-001", "full_name":"A1-001 - Updated Name", ...},
  "message": "Rabbit updated successfully"
}
```

**Business Rules:**
- ✅ Cannot mark as Culled/Deceased/Sold if in active breeding
- ✅ Cage occupancy updated automatically if cage changed
- ✅ Status recalculated if age-based
- ✅ Ownership verified (user_id match)

---

### DELETE /api/rabbits?id=ObjectId
Delete or soft-delete a rabbit.

**Query Parameters:**
```
id=507f1f77bcf86cd799439013 (required)
```

**Response (200):**
```json
{
  "data": {"_id":""},
  "message": "Rabbit deleted successfully"
}
```

**Rules:**
- ✅ Cannot delete if in active breeding
- ✅ Cannot delete if has active litters
- ✅ Soft delete (mark as Deceased) if has related records (Sales, Culls, Deaths)
- ✅ Hard delete if no related records
- ✅ Cage occupancy updated

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {"ear_tag_id": ["Ear tag ID is required"]},
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### 404 Not Found
```json
{
  "error": "Breed not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### 409 Conflict
```json
{
  "error": "Rabbit with ear tag ID \"A1-001\" already exists",
  "code": "DUPLICATE_ENTRY",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

---

## Validation Rules

| Field | Rules |
|-------|-------|
| ear_tag_id | Required, 1-50 chars, unique per user |
| name | Optional, max 100 chars |
| gender | Required, 'Male' \| 'Female' |
| date_of_birth | Required, valid ISO date |
| breed_id | Required, valid ObjectId |
| current_cage_id | Required, valid ObjectId |
| status | Optional, defaults to 'Kit' |
| source_type | Optional, defaults to 'Born' |
| source_farm | Optional, max 100 chars |
| parent_doe_id | Optional, valid ObjectId, must be Female |
| parent_buck_id | Optional, valid ObjectId, must be Male |
| is_pregnant | Optional, defaults to false, only for Female |

---

## Status Progression

Auto-calculated from age based on breed maturity ages:

```
Age 0-30 days  → Kit
Age 30-60 days → Weaner
Age 60-150 days → Grower
Age 150+ days  → Active
```

Manual statuses override:
- Sick, Quarantined, Culled, Deceased, Sold

---

## Query Examples

### Get Active Females
```
GET /api/rabbits?status=Active&gender=Female
```

### Search by Ear Tag
```
GET /api/rabbits?search=A1&limit=10
```

### Get Pregnant Does
```
GET /api/rabbits?gender=Female&status=Active (check is_pregnant in response)
```

### Get All Rabbits in Breed
```
GET /api/rabbits?breed_id=507f1f77bcf86cd799439011&limit=100
```

### Sort by Recent
```
GET /api/rabbits?sortBy=createdAt&sortOrder=desc&limit=20
```

---

## Frontend Integration

### Using with RabbitForm Component

```typescript
import { RabbitForm, RabbitFormData } from '@/components/RabbitForm';

const handleSubmit = async (data: RabbitFormData) => {
  const response = await fetch('/api/rabbits', {
    method: initialData?.ear_tag_id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const result = await response.json();
  console.log('Success:', result.data);
};

return (
  <RabbitForm
    breeds={breeds}
    cages={cages}
    onSubmit={handleSubmit}
    onCancel={handleCancel}
    initialData={editingRabbit}
  />
);
```

---

## Database Models Referenced

### Breed
```typescript
{
  _id: ObjectId,
  name: string,
  maturity_age_days: number,
  weaning_age_days: number,
  grower_age_days: number
}
```

### Cage
```typescript
{
  _id: ObjectId,
  name: string,
  cage_type: 'Buck' | 'Doe' | 'Grower' | 'Quarantine' | 'Nesting',
  current_occupants: ObjectId[]
}
```

---

## Authentication

All endpoints require Clerk authentication:
- Session automatically included by Next.js middleware
- User ID extracted from Clerk context
- All records scoped to user_id

---

## Testing Commands

```bash
# Create rabbit
curl -X POST http://localhost:3000/api/rabbits \
  -H "Content-Type: application/json" \
  -d '{
    "ear_tag_id": "A1-001",
    "gender": "Female",
    "date_of_birth": "2024-06-15",
    "breed_id": "507f1f77bcf86cd799439011",
    "current_cage_id": "507f1f77bcf86cd799439012",
    "source_type": "Born"
  }'

# Get all rabbits
curl http://localhost:3000/api/rabbits

# Update rabbit
curl -X PUT "http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439013" \
  -H "Content-Type: application/json" \
  -d '{"status": "Active"}'

# Delete rabbit
curl -X DELETE "http://localhost:3000/api/rabbits?id=507f1f77bcf86cd799439013"
```

---

## Performance Tips

- Use pagination for large result sets (default limit: 20, max: 100)
- Filter by status/gender early to reduce result set
- Sort by indexed fields: user_id, status, gender, breed_id
- Search term can match ear_tag_id or name (both indexed)
- Lean queries exclude unnecessary virtuals for list endpoints

---

## Related Files

- **Schema**: [database/rabbit.model.ts](database/rabbit.model.ts)
- **Validation**: [lib/validations/rabbit.ts](lib/validations/rabbit.ts)
- **API Routes**: [app/api/rabbits/route.ts](app/api/rabbits/route.ts)
- **Error Handler**: [lib/api-error-handler.ts](lib/api-error-handler.ts)
- **Database Connection**: [lib/mongodb.ts](lib/mongodb.ts)
- **Frontend Component**: [components/RabbitForm.tsx](components/RabbitForm.tsx)
