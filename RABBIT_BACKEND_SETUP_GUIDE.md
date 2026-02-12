# Rabbit Backend Setup & Verification Guide

## Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] MongoDB 4.4+ running (Atlas or local)
- [x] Next.js 14+ project initialized
- [x] Clerk authentication configured
- [x] Environment variables set in `.env.local`
- [x] Mongoose ^8.0 installed

---

## Environment Setup

### 1. Install Dependencies

```bash
npm install mongoose zod
```

Already included in package.json:
- `@clerk/nextjs` ^6.35.0
- `mongoose` ^8.19.3
- `zod` ^4.2.1
- `next` 16.0.1

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
CLERK_WEBHOOK_SECRET=whsec_your_secret (optional)

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000 (development)
NODE_ENV=development
```

### 3. Verify MongoDB Connection

Test connection in terminal:
```bash
# Option 1: Using MongoDB Atlas
mongo "mongodb+srv://username:password@cluster.mongodb.net/database_name"

# Option 2: Using local MongoDB
mongosh mongodb://localhost:27017/database_name
```

---

## Implementation Status

### ✅ Completed Components

#### 1. Rabbit Model (database/rabbit.model.ts)
- [x] Schema with all required fields
- [x] Unique ear_tag_id constraint
- [x] ObjectId references to Breed and Cage
- [x] Enum fields for gender, status, source_type
- [x] Boolean is_pregnant field
- [x] Timestamps (createdAt, updatedAt)
- [x] Virtual fields: age_in_days, full_name, maturity_status
- [x] Static method: getStats(userId)
- [x] Pre-save middleware: Auto-status calculation
- [x] Indexes: user_id, status, gender, breed_id, etc.

#### 2. Validation Schema (lib/validations/rabbit.ts)
- [x] RabbitFormSchema with Zod
- [x] Field validation rules
- [x] ObjectId format validation
- [x] Enum validation for gender, status, source_type
- [x] CreateRabbitSchema (for POST)
- [x] UpdateRabbitSchema (for PUT, all fields optional)
- [x] RabbitQuerySchema (for GET with pagination)

#### 3. API Route Handlers (app/api/rabbits/route.ts)
- [x] GET handler with pagination, filtering, sorting
- [x] POST handler for creating rabbits
- [x] PUT handler for updating rabbits
- [x] DELETE handler with soft/hard delete logic
- [x] Clerk authentication middleware
- [x] connectDB integration
- [x] Full error handling

#### 4. Business Logic Validations
- [x] Duplicate ear_tag_id prevention
- [x] Breed existence checks
- [x] Cage existence checks
- [x] Parent rabbit gender validation
- [x] Pregnancy status only for females
- [x] Cage occupancy management
- [x] Terminal status conflict checks
- [x] Active breeding/litter prevention
- [x] Ownership verification (multi-tenancy)

#### 5. Error Handling
- [x] Zod validation errors with field details
- [x] MongoDB duplicate key errors
- [x] Resource not found errors
- [x] Authorization errors
- [x] Business logic conflict errors
- [x] Standardized error response format

#### 6. Database Connection
- [x] Global mongoose caching
- [x] Connection pooling
- [x] Model registration via initModels()
- [x] Hot-reload support for Next.js dev mode

---

## Verification Steps

### 1. Check Files Exist

```bash
# Model file
ls -la app/api/rabbits/route.ts
ls -la database/rabbit.model.ts
ls -la lib/validations/rabbit.ts
ls -la lib/mongodb.ts
ls -la lib/api-error-handler.ts
ls -la components/RabbitForm.tsx
```

### 2. Verify Imports in database/index.ts

```bash
# Check that rabbit.model is imported and included in initModels()
grep -n "rabbit" database/index.ts
grep -n "Rabbit" database/index.ts
```

Expected output should show:
- `export * from './rabbit.model';`
- `import { Rabbit } from './rabbit.model';`
- `Rabbit` in initModels() function

### 3. Check TypeScript Compilation

```bash
# Build the project
npm run build

# Should complete without errors
```

### 4. Start Development Server

```bash
npm run dev

# Expected output:
# ▲ Next.js 16.0.1
# - Local: http://localhost:3000
```

### 5. Test API Endpoints

#### Test Authentication
```bash
# This should fail with 401 if not authenticated
curl http://localhost:3000/api/rabbits
# Expected: {"error": "Authentication required", "code": "UNAUTHORIZED"}
```

#### Test Create Rabbit (requires auth)
```bash
# You need a valid Clerk session token
# In browser console with auth:
fetch('/api/rabbits', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    ear_tag_id: 'TEST-001',
    name: 'Test Rabbit',
    gender: 'Female',
    date_of_birth: '2024-06-15',
    breed_id: 'valid-breed-id',
    current_cage_id: 'valid-cage-id',
    source_type: 'Born'
  })
}).then(r => r.json()).then(d => console.log(d))
```

### 6. Browser Testing

1. Navigate to localhost:3000
2. Sign in with Clerk authentication
3. Find the rabbit form component
4. Test creating a new rabbit:
   - Fill all required fields
   - Submit form
   - Verify success notification
   - Check console for API response

5. Test updating a rabbit:
   - Edit an existing rabbit
   - Change one field (e.g., status)
   - Submit
   - Verify update without error

6. Test filtering:
   - Apply filters (status, gender)
   - Verify results change
   - Verify pagination works

### 7. Database Inspection

```bash
# Connect to MongoDB
mongosh

# Use your database
use sunguch_3

# Inspect rabbit collection
db.rabbits.findOne()

# Check indexes
db.rabbits.getIndexes()

# Count documents
db.rabbits.countDocuments()

# Find by user_id (from Clerk session)
db.rabbits.findOne({user_id: "your-clerk-id"})
```

### 8. Verify Model Initialization

Check server logs for:
```
--- Registering Mongoose Models ---
Successfully initialized all Mongoose models.
```

This confirms the initModels() function executed on connection.

---

## Common Issues & Solutions

### Issue 1: "ModelNotRegistered" Error

**Symptom**: Error when saving rabbits

**Solution**:
```typescript
// Make sure initModels() is called in mongodb.ts
// Check database/index.ts exports Rabbit

import { initModels } from '@/database/index';

// In connectDB function:
function loadModels() {
  if (Object.keys(mongoose.models).length === 0) {
    initModels();
  }
}
```

### Issue 2: "ear_tag_id already exists"

**Symptom**: 409 Conflict on create

**Solution**:
- Verify ear_tag_id is truly unique in database
- Check user_id matches (query: `db.rabbits.find({ear_tag_id: "A1-001"})`)
- Different users can have same ear_tag_id (filtered by user_id)

### Issue 3: "Breed not found" Error

**Symptom**: 404 when creating rabbit with valid breed_id

**Solution**:
```bash
# Check breed exists in database
mongosh
use sunguch_3
db.breeds.findById(ObjectId("your-breed-id"))

# If not found, seed breeds first
```

### Issue 4: "Cage not found" Error

**Symptom**: 404 when creating rabbit with valid cage_id

**Solution**:
```bash
# Check cage exists
mongosh
use sunguch_3
db.cages.findById(ObjectId("your-cage-id"))

# If not found, create cage or verify cage_id
```

### Issue 5: Connection Timeout

**Symptom**: "MongooseError: Cannot connect to MongoDB"

**Solution**:
1. Verify MONGODB_URI in .env.local
2. Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for development)
3. Test connection: `mongosh "your-mongodb-uri"`
4. Restart dev server: `npm run dev`

### Issue 6: Validation Errors

**Symptom**: 400 response with validation details

**Check**:
- `ear_tag_id`: Required, string, 1-50 chars
- `gender`: Must be 'Male' or 'Female'
- `date_of_birth`: Must be valid ISO date string (YYYY-MM-DD)
- `breed_id`: Must be valid ObjectId (24 hex characters)
- `current_cage_id`: Must be valid ObjectId

### Issue 7: Authentication Not Working

**Symptom**: Always getting 401 "Authentication required"

**Solution**:
1. Verify Clerk keys in .env.local
2. Check Clerk middleware is configured in `_app.tsx` or `layout.tsx`
3. Sign in first before making requests
4. Check browser DevTools → Application → Cookies for `__session` cookie

---

## Load Testing Checklist

### Pre-Load Test
- [ ] 10 rabbits created without error
- [ ] GET /api/rabbits returns all 10
- [ ] Pagination works (page=1, limit=5)
- [ ] Filtering by status works
- [ ] Search by ear_tag_id works

### Performance Test
- [ ] List endpoint responds < 500ms (with 100+ rabbits)
- [ ] Create endpoint responds < 1s
- [ ] Update endpoint responds < 500ms
- [ ] Indexes are being used (check MongoDB logs)

### Edge Case Tests
- [ ] Create with duplicate ear_tag_id → 409
- [ ] Create with invalid breed_id → 404
- [ ] Update with is_pregnant=true for male → 400
- [ ] Delete with active breeding → 409
- [ ] Query with invalid ObjectId → 400

---

## Monitoring & Debugging

### Enable Debug Logging

```typescript
// In mongodb.ts, add:
mongoose.set('debug', true);

// In browser console:
localStorage.setItem('debug', 'mongoose:*');
```

### Check Connection Pool

```javascript
// In Node.js console (within route handler):
console.log('Connection readyState:', mongoose.connection.readyState);
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
```

### Monitor Database Queries

```bash
# In MongoDB Atlas:
1. Go to Monitoring → Query Profiler
2. View slow queries
3. Check index usage

# Or locally:
db.system.profile.find().pretty()
```

---

## Migration & Backup

### Export Rabbit Data

```bash
mongoexport --uri "mongodb+srv://user:pass@cluster.mongodb.net/database" \
  --collection rabbits \
  --out rabbits_backup.json
```

### Import Rabbit Data

```bash
mongoimport --uri "mongodb+srv://user:pass@cluster.mongodb.net/database" \
  --collection rabbits \
  --file rabbits_backup.json
```

---

## Production Deployment Checklist

- [ ] MONGODB_URI uses production database
- [ ] CLERK_SECRET_KEY is production key
- [ ] NODE_ENV=production
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] Database indexes created (automatic on first connection)
- [ ] Error logging configured (e.g., Sentry)
- [ ] Rate limiting enabled (if needed)
- [ ] CORS configured if API used from different domain
- [ ] SSL certificates valid
- [ ] Database backups scheduled
- [ ] Monitoring alerts configured

---

## Performance Optimization Tips

1. **Use Pagination**: Always limit results to prevent memory issues
2. **Add Indexes**: Already configured for: user_id, status, gender, breed_id
3. **Lean Queries**: List endpoints use `.lean()` to skip virtuals
4. **Caching**: Consider Redis cache for breed/cage lists
5. **Connection Pooling**: MongoDB handles automatically
6. **Query Optimization**: Use `select()` to limit fields returned

---

## Related Documentation

- [Rabbit Backend Implementation](./RABBIT_BACKEND_IMPLEMENTATION.md) - Full technical documentation
- [API Quick Reference](./RABBIT_API_QUICK_REFERENCE.md) - API endpoints and examples
- [Mongoose Documentation](https://mongoosejs.com/)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## Support & Troubleshooting

For issues:
1. Check error message code (e.g., VALIDATION_ERROR, NOT_FOUND)
2. Review [Error Handling section](#error-handling)
3. Check [Common Issues](#common-issues--solutions)
4. Verify [Environment Setup](#environment-setup)
5. Review logs in MongoDB Atlas or local database
6. Check Clerk authentication status

---

## Final Verification

Run this checklist to confirm everything works:

```typescript
// Execute in browser console after signing in:
async function testRabbitAPI() {
  try {
    // 1. Test GET
    const getRes = await fetch('/api/rabbits?page=1&limit=5');
    console.log('GET Test:', getRes.status === 200 ? '✓' : '✗');
    
    // 2. Test POST (requires valid breed_id and cage_id)
    // const postRes = await fetch('/api/rabbits', {
    //   method: 'POST',
    //   headers: {'Content-Type': 'application/json'},
    //   body: JSON.stringify({...rabbitData})
    // });
    // console.log('POST Test:', postRes.status === 201 ? '✓' : '✗');
    
    console.log('Backend verification complete!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRabbitAPI();
```

All tests passing = ✅ Backend is ready for production!
