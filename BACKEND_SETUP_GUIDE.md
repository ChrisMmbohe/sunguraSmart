# Backend Setup & Quick Start Guide

## 🚀 Quick Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB Atlas account (free tier available)
- Clerk account (free tier)
- Git

### Installation Steps

#### 1. Install Zod Validation Library

```bash
npm install zod
```

#### 2. Verify Environment Variables

Ensure `.env.local` contains:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

#### 3. Verify Database Models

Check that all models are registered in `/database/index.ts`:

```typescript
import { Rabbit } from './rabbit.model';
import { Breed } from './breed.model';
import { Cage } from './cage.model';

export { Rabbit, Breed, Cage };
```

#### 4. Start Development Server

```bash
npm run dev
```

Your API endpoints are now available:
- `GET /api/rabbits`
- `POST /api/rabbits`
- `PUT /api/rabbits/[id]`
- `DELETE /api/rabbits/[id]`
- `GET /api/breeds`
- `POST /api/breeds`
- `GET /api/cages`
- `POST /api/cages`

---

## 🧪 Testing Endpoints

### Using cURL

#### Create a Rabbit

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

#### Get All Rabbits

```bash
curl http://localhost:3000/api/rabbits?page=1&limit=20
```

#### Update a Rabbit

```bash
curl -X PUT http://localhost:3000/api/rabbits/507f1f77bcf86cd799439014 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bunny Updated",
    "status": "Weaner"
  }'
```

#### Delete a Rabbit

```bash
curl -X DELETE http://localhost:3000/api/rabbits/507f1f77bcf86cd799439014
```

### Using Postman

1. **Create New Request** → POST
2. **URL**: `http://localhost:3000/api/rabbits`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw JSON):
   ```json
   {
     "ear_tag_id": "A-001",
     "name": "Bunny",
     "gender": "Female",
     "date_of_birth": "2024-01-15",
     "breed_id": "507f1f77bcf86cd799439012",
     "current_cage_id": "507f1f77bcf86cd799439013",
     "status": "Active",
     "source_type": "Born",
     "is_pregnant": false
   }
   ```
5. **Click Send**

---

## 💻 Integration in Components

### Example: Rabbits Page with API Integration

```typescript
// app/rabbits/page.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { getRabbitsForTable, getBreedsForForm, getCagesForForm } from '@/lib/data-fetcher';
import { columns } from '@/app/rabbits/columns';
import { RabbitsPageClient } from './rabbits-page-client';

export default async function Page() {
  try {
    const [rabbitsData, breedsData, cagesData] = await Promise.all([
      getRabbitsForTable(),
      getBreedsForForm(),
      getCagesForForm(),
    ]);

    return (
      <RabbitsPageClient
        initialRabbits={rabbitsData}
        initialBreeds={breedsData}
        initialCages={cagesData}
        columns={columns}
      />
    );
  } catch (err) {
    return (
      <div className="p-4 text-red-600">
        Failed to load rabbits: {err instanceof Error ? err.message : 'Unknown error'}
      </div>
    );
  }
}
```

### Example: Form Submission with API Call

```typescript
// components/RabbitForm.tsx
'use client';

import { rabbitsApi } from '@/lib/api-client';
import { RabbitFormData } from '@/lib/validations/rabbit';
import { useState } from 'react';

export function RabbitForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: RabbitFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await rabbitsApi.create(data);
      setIsSubmitting(false);
      onSuccess(); // Trigger parent refetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit({
        ear_tag_id: formData.get('ear_tag_id') as string,
        // ... other fields
      });
    }}>
      {/* Form fields */}
      {error && <p className="text-red-600">{error}</p>}
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Rabbit'}
      </button>
    </form>
  );
}
```

### Example: Using React Hooks

```typescript
// app/rabbits/rabbits-page-client.tsx
'use client';

import { useRabbitMutations, useBreedsQuery, useCagesQuery } from '@/hooks/useApi';
import { useEffect, useState } from 'react';

export function RabbitsPageClient({ initialRabbits }: { initialRabbits: any[] }) {
  const { create, update, delete: deleteRabbit } = useRabbitMutations();
  const { data: breedsData, refetch: refetchBreeds } = useBreedsQuery();
  const { data: cagesData, refetch: refetchCages } = useCagesQuery();
  const [rabbits, setRabbits] = useState(initialRabbits);

  async function handleCreateRabbit(formData: any) {
    try {
      await create.mutate(formData);
      // Refetch rabbits
      // Note: You'll need to implement a refetch mechanism
      // Or use SWR/React Query for automatic refetching
    } catch (error) {
      console.error('Failed to create rabbit:', error);
    }
  }

  async function handleDeleteRabbit(rabbitId: string) {
    try {
      await deleteRabbit.mutate(rabbitId);
      setRabbits((prev) => prev.filter((r) => r._id !== rabbitId));
    } catch (error) {
      console.error('Failed to delete rabbit:', error);
    }
  }

  return (
    <div>
      {/* Your UI */}
      {create.error && <p className="text-red-600">{create.error.message}</p>}
      {create.isPending && <p>Creating...</p>}
      <button onClick={() => handleCreateRabbit(formData)}>
        Create Rabbit
      </button>
    </div>
  );
}
```

---

## 🔍 Debugging

### Enable Logging

Add logging in API routes:

```typescript
export async function GET(req: NextRequest) {
  console.log('GET /api/rabbits', {
    userId,
    params: Object.fromEntries(req.nextUrl.searchParams),
  });

  try {
    // ... your code
  } catch (error) {
    console.error('API Error:', error);
    return handleApiError(error);
  }
}
```

### Check MongoDB Connection

```typescript
// lib/test-db-connection.ts
import connectDB from '@/lib/mongodb';
import { Rabbit } from '@/database/rabbit.model';

export async function testConnection() {
  try {
    await connectDB();
    const count = await Rabbit.countDocuments();
    console.log(`✅ Connected to MongoDB. Found ${count} rabbits.`);
  } catch (error) {
    console.error('❌ Failed to connect:', error);
  }
}
```

### Validate Clerk Auth

```typescript
// lib/test-auth.ts
import { auth } from '@clerk/nextjs/server';

export async function testAuth() {
  try {
    const { userId } = await auth();
    console.log(`✅ Auth working. Current user: ${userId}`);
  } catch (error) {
    console.error('❌ Auth failed:', error);
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error

**Cause**: User is not authenticated with Clerk

**Solution**:
1. Check if `CLERK_SECRET_KEY` is set in `.env.local`
2. Ensure user is logged in
3. Verify Clerk middleware is configured in `middleware.ts`

### Issue: "Invalid breed ID" Error

**Cause**: Breed doesn't exist in database

**Solution**:
1. Create a breed first via `POST /api/breeds`
2. Use the returned `_id` when creating a rabbit
3. Verify the breed belongs to the same user

### Issue: "Duplicate entry" Error

**Cause**: A rabbit with the same ear_tag_id already exists

**Solution**:
1. Use a unique ear_tag_id
2. Or update the existing rabbit instead of creating a new one

### Issue: "Validation failed" Error

**Cause**: Request data doesn't match schema

**Solution**:
1. Check the `details` field in error response
2. Ensure date fields are ISO format (YYYY-MM-DD)
3. Verify ObjectIds are valid 24-character hex strings

### Issue: MongoDB Connection Timeout

**Cause**: MongoDB Atlas IP whitelist issue

**Solution**:
1. Go to MongoDB Atlas → Network Access
2. Add your current IP or allow 0.0.0.0/0 (for development)
3. Test connection with `testConnection()` function

---

## 📈 Performance Tips

### 1. Use Pagination

Always paginate results:
```typescript
// Good
const response = await rabbitsApi.list({ page: 1, limit: 50 });

// Bad - could return thousands of records
const response = await rabbitsApi.list();
```

### 2. Filter at API Level

Reduce data transfer:
```typescript
// Good - filter on server
const response = await rabbitsApi.list({ 
  gender: 'Female',
  status: 'Active'
});

// Bad - fetch all then filter in client
const response = await rabbitsApi.list();
const filtered = response.data.filter(r => r.gender === 'Female');
```

### 3. Cache Server-Side Data

For page components, use server-side data fetchers:
```typescript
// Cached at request time, not re-fetched
const breeds = await getBreedsForForm();
```

### 4. Implement Client-Side Caching

Consider using SWR or React Query:
```typescript
import useSWR from 'swr';

function MyComponent() {
  const { data, error } = useSWR('/api/rabbits', fetch);
  // ... auto-revalidation, caching, etc.
}
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Database has production MongoDB instance
- [ ] Clerk production keys configured
- [ ] CORS/origin restrictions set appropriately
- [ ] Rate limiting implemented (optional)
- [ ] Error logging set up (Sentry, PostHog, etc.)
- [ ] Database backups configured
- [ ] Load testing performed (1000+ concurrent users)

### Deploy to Vercel

```bash
# Commit and push to GitHub
git add .
git commit -m "Add backend API implementation"
git push origin main

# Go to https://vercel.com/new
# Select your repository
# Add environment variables
# Click Deploy
```

---

## 📚 Next Steps

1. **Implement Optimistic Updates**: Show UI changes immediately, sync with server
2. **Add Rate Limiting**: Use Upstash Redis for DDoS protection
3. **Set up Webhooks**: Send real-time events to external services
4. **Implement Caching**: Add Redis for frequently accessed data
5. **Add Analytics**: Track API usage and performance with PostHog
6. **Write Tests**: Add Jest tests for API routes and validations

---

## 📞 Support

For issues or questions:
1. Check the [Backend Implementation Guide](./BACKEND_IMPLEMENTATION_GUIDE.md)
2. Review [API Documentation](#api-endpoints)
3. Check server logs: `npm run dev` output
4. Enable debug logging in API routes

---

## 📋 File Checklist

Verify these files exist and are properly configured:

```
✓ /lib/mongodb.ts - MongoDB connection
✓ /lib/api-error-handler.ts - Error handling utilities
✓ /lib/api-client.ts - Client-side API wrapper
✓ /lib/validations/rabbit.ts - Rabbit Zod schema
✓ /lib/validations/breed.ts - Breed Zod schema
✓ /lib/validations/cage.ts - Cage Zod schema
✓ /app/api/rabbits/route.ts - Rabbits CRUD endpoints
✓ /app/api/breeds/route.ts - Breeds CRUD endpoints
✓ /app/api/cages/route.ts - Cages CRUD endpoints
✓ /hooks/useApi.ts - React hooks for API
✓ /database/rabbit.model.ts - Mongoose rabbit schema
✓ /database/breed.model.ts - Mongoose breed schema
✓ /database/cage.model.ts - Mongoose cage schema
```

---

## 🎉 You're Ready!

Your backend is now ready for production use. Start integrating it with your frontend components and enjoy a robust, scalable farm management system!
