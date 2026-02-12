# RabbitForm Enhancement Summary

## Changes Made

### 1. **Ear Tag ID → Dropdown Select** ✅
- Changed from text input to select dropdown
- Displays only unused/available ear tag IDs
- Falls back to text input if no dropdown options available
- New function: `getAvailableEarTagIds()` in data-fetcher.ts

### 2. **Conditional Source Farm Field** ✅
- Field only appears when Source Type is "Purchased" or "Gifted"
- Required when visible with validation
- Label dynamically explains field purpose

### 3. **Photo URL Support** ✅
- New optional field for photo URL
- URL validation (must be valid URL format)
- Live preview of image in form
- Stores URL to database only (not file upload)

### 4. **Backend Integration** ✅
- Updated Rabbit model schema to include `photo_url` field
- Updated Zod validation schema with photo_url validation
- Updated RabbitFormData interface to include new fields
- source_farm field validation (required for Purchased/Gifted)

### 5. **Frontend Updates** ✅
- RabbitForm.tsx now accepts earTagOptions prop
- Conditional rendering of source_farm field
- Photo URL preview with image display
- Enhanced validation logic
- Updated page.tsx to fetch and pass ear tag options
- Updated rabbits-page-client.tsx to handle ear tag options

---

## Database Schema Updates

```typescript
// Added to rabbit.model.ts schema:
photo_url: { type: String, default: null, trim: true }
```

---

## Form Flow

### Creating a New Rabbit:
1. **Ear Tag ID** - User selects from dropdown of available tags
2. **Name** - Optional friendly name
3. **Gender** - Male or Female
4. **Date of Birth** - For age calculation
5. **Breed** - Select from breeds (unchanged)
6. **Cage** - Select from available cages (unchanged)
7. **Status** - Lifecycle status (unchanged)
8. **Source Type** - Born, Purchased, or Gifted
9. **Source Farm** - *(Conditional)* Only if Purchased/Gifted selected
   - Required field showing seller/farm name
10. **Photo URL** - Optional image URL
    - Validated as valid URL
    - Shows live preview
11. **Is Pregnant** - Checkbox for female status tracking

---

## Validation Rules

### Ear Tag ID
- Required
- Must be selected from available list
- Unique per user (enforced on backend)

### Source Farm
- **Required if**: Source Type is "Purchased" or "Gifted"
- **Optional if**: Source Type is "Born"
- Max 100 characters

### Photo URL
- Optional
- Must be valid URL if provided
- Live preview in form

### Source Type
- Required
- Options: Born, Purchased, Gifted
- Determines if source_farm is required

---

## Data Fetcher Function

### New Function: `getAvailableEarTagIds()`

```typescript
// Returns: Array<{ id: string; label: string }>
// Generates available ear tag patterns:
// - A-001, A-002, ... A-020
// - B-001, B-002, ... B-020
// - C-001, C-002, ... C-020
// - D-001, D-002, ... D-020
// - E-001, E-002, ... E-020
//
// Filters out already-assigned tags
// Falls back to empty array on error
```

---

## API Integration

The form now properly submits with:
- All required fields validated
- photo_url as optional string
- source_farm required validation handled client-side
- Matches backend RabbitFormData structure

### POST /api/rabbits Request Body
```json
{
  "ear_tag_id": "A-001",
  "name": "Bunny",
  "gender": "Female",
  "date_of_birth": "2024-06-15",
  "breed_id": "507f...",
  "current_cage_id": "507f...",
  "status": "Kit",
  "source_type": "Purchased",
  "source_farm": "John's Rabbit Farm",
  "is_pregnant": false,
  "photo_url": "https://example.com/rabbit.jpg"
}
```

---

## Testing Checklist

- [ ] Form loads with available ear tag dropdown
- [ ] Ear tag dropdown shows only unused tags
- [ ] Source Farm field hidden when source_type is "Born"
- [ ] Source Farm field required and visible for "Purchased"
- [ ] Source Farm field required and visible for "Gifted"
- [ ] Photo URL validation works (invalid URL shows error)
- [ ] Photo URL preview displays when valid URL provided
- [ ] Form submission includes all new fields
- [ ] Backend saves photo_url and source_farm correctly
- [ ] Validation errors display properly
- [ ] Success message shows after submission

---

## Files Modified

1. **database/rabbit.model.ts**
   - Added `photo_url` field

2. **lib/validations/rabbit.ts**
   - Added `photo_url` field validation
   - Added source_farm required validation for Purchased/Gifted

3. **lib/data-fetcher.ts**
   - Added `getAvailableEarTagIds()` function

4. **components/RabbitForm.tsx**
   - Added IEarTagOption interface
   - Updated RabbitFormData interface
   - Added earTagOptions prop
   - Added conditional source_farm field
   - Added photo_url field with preview
   - Enhanced validation logic

5. **app/rabbits/page.tsx**
   - Added getAvailableEarTagIds import
   - Fetches ear tag options
   - Passes earTagData to RabbitsPageClient

6. **app/rabbits/rabbits-page-client.tsx**
   - Added initialEarTags prop
   - Passes earTagOptions to RabbitForm

---

## Benefits

✅ **Better UX**: Users select from available tags instead of typing
✅ **Data Quality**: Prevents duplicate ear tag IDs
✅ **Required Info**: Source documentation for purchased/gifted rabbits
✅ **Media Support**: Photo URLs for visual identification
✅ **Validation**: Client and server-side validation
✅ **Conditional Fields**: Only show relevant fields based on selection

---

## Next Steps (Optional Enhancements)

1. **File Upload**: Replace URL-only with actual image upload to cloud storage
2. **Photo Gallery**: Display photo in rabbit list/detail views
3. **Barcode Scanning**: Auto-populate ear tag from barcode scan
4. **Source Database**: Maintain list of common breeders/farms
5. **Batch Import**: Import multiple rabbits with source/photo info
6. **Image Crop**: Allow cropping/rotating photo before save

---

All changes are backwards compatible. Existing rabbits without photo_url or source_farm will continue to work.
