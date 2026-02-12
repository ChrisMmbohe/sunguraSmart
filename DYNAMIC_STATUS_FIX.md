# Dynamic Status Calculation Fix - Health Records

## Issue Fixed
**Problem:** Status was not updating dynamically when a health record was modified. For example, changing treatment end date or quarantine status did not update the `current_status` field.

**Example:** Record K1-019-4-393 was edited, but the status remained unchanged instead of reflecting the new values.

**Root Cause:** When updating a record locally in the client component, only the basic fields were being updated (`date_of_diagnosis`, `treatment_start_date`, `treatment_end_date`, `quarantined`, `notes`). The derived fields (`current_status`, `is_active`, `days_since_diagnosis`, `treatment_duration_days`) were not being recalculated.

---

## Solution Implemented

### Before (Incorrect)
```typescript
if (isEditing && selectedRecord) {
  // ❌ Only copying basic fields, NOT recalculating status
  const updatedRecord: HealthRecordTableData = {
    ...selectedRecord,
    date_of_diagnosis: new Date(formData.date_of_diagnosis),
    treatment_start_date: new Date(formData.treatment_start_date),
    treatment_end_date: formData.treatment_end_date 
      ? new Date(formData.treatment_end_date)
      : null,
    quarantined: formData.quarantined,
    notes: formData.notes || null,
    // ❌ Missing: is_active, current_status, days_since_diagnosis, treatment_duration_days
  };
  setRecords(records.map(r => r._id === selectedRecord._id ? updatedRecord : r));
}
```

**Problem:** The derived fields remain unchanged, so the table still shows the old status.

### After (Correct)
```typescript
if (isEditing && selectedRecord) {
  // ✅ Parse all date fields first
  const diagnosisDate = new Date(formData.date_of_diagnosis);
  const treatmentStartDate = new Date(formData.treatment_start_date);
  const treatmentEndDate = formData.treatment_end_date 
    ? new Date(formData.treatment_end_date)
    : null;
  const today = new Date();
  
  // ✅ Recalculate ALL derived fields
  const isActive = treatmentEndDate === null;
  const daysSinceDiagnosis = Math.floor((today.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24));
  const treatmentDurationDays = treatmentEndDate
    ? Math.floor((treatmentEndDate.getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // ✅ Recalculate status using the SAME logic as data-fetcher.ts
  let currentStatus: 'Sick' | 'Quarantined' | 'Treated' | 'Resolved';
  if (isActive) {
    currentStatus = formData.quarantined ? 'Quarantined' : 'Sick';
  } else {
    currentStatus = treatmentEndDate && treatmentEndDate < today ? 'Resolved' : 'Treated';
  }

  // ✅ Create updated record with ALL fields including derived fields
  const updatedRecord: HealthRecordTableData = {
    ...selectedRecord,
    date_of_diagnosis: diagnosisDate,
    treatment_start_date: treatmentStartDate,
    treatment_end_date: treatmentEndDate,
    quarantined: formData.quarantined,
    notes: formData.notes || null,
    is_active: isActive,
    current_status: currentStatus,
    days_since_diagnosis: daysSinceDiagnosis,
    treatment_duration_days: treatmentDurationDays,
  };
  setRecords(records.map(r => r._id === selectedRecord._id ? updatedRecord : r));
}
```

---

## Status Calculation Logic

The status is calculated using the same logic as `data-fetcher.ts`:

### Decision Tree
```
Is treatment ongoing? (treatment_end_date === null)
├─ YES (isActive = true)
│  ├─ Is quarantined? → Status = 'Quarantined'
│  └─ Not quarantined? → Status = 'Sick'
└─ NO (isActive = false, treatment ended)
   ├─ Is end date in the past? → Status = 'Resolved'
   └─ Is end date in the future? → Status = 'Treated'
```

### Examples

**Example 1: Ongoing Treatment**
- `treatment_end_date`: null
- `quarantined`: true
- **Result:** Status = 'Quarantined' ✅

**Example 2: Completed Treatment (Past)**
- `treatment_end_date`: 2025-01-01 (past date)
- `quarantined`: false
- **Result:** Status = 'Resolved' ✅

**Example 3: Completed Treatment (Future)**
- `treatment_end_date`: 2025-02-15 (future date)
- `quarantined`: false
- **Result:** Status = 'Treated' ✅

**Example 4: Record K1-019-4-393**
- If edited to set `treatment_end_date` to past date
- Status now correctly updates to 'Resolved' ✅

---

## Fields Recalculated

When a record is updated, these derived fields are now recalculated:

| Field | Calculation |
|-------|-------------|
| `is_active` | `treatment_end_date === null` |
| `current_status` | Logic tree above |
| `days_since_diagnosis` | Days between diagnosis date and today |
| `treatment_duration_days` | Days between start and end date (null if ongoing) |

---

## Changes Made

### File: `app/health/health-page-client.tsx`

**Location:** `handleFormSubmit()` function, update section

**Lines Changed:** Lines 73-92 (approximately)

**What Changed:**
1. Added date parsing for all three date fields
2. Added today's date reference
3. Added calculation of `is_active`
4. Added calculation of `days_since_diagnosis`
5. Added calculation of `treatment_duration_days`
6. Added full status calculation logic
7. Included all derived fields in `updatedRecord` object

---

## Impact

### User-Facing Changes
✅ Status now updates immediately when editing a record
✅ No need to refresh page to see updated status
✅ Table reflects changes in real-time
✅ Modal shows updated status

### Example Flow
```
Before Fix:
1. User edits record K1-019-4-393
2. Sets treatment_end_date to past date
3. Clicks save
4. Status still shows 'Sick' (WRONG) ❌

After Fix:
1. User edits record K1-019-4-393
2. Sets treatment_end_date to past date
3. Clicks save
4. Status now shows 'Resolved' (CORRECT) ✅
5. Table updates immediately
```

---

## Code Quality

✅ **Consistency:** Uses exact same logic as `data-fetcher.ts`
✅ **Type-Safe:** All fields properly typed
✅ **No Errors:** Passes TypeScript compilation
✅ **Maintainable:** Clear variable names and comments
✅ **Efficient:** Calculations only happen when needed

---

## Testing

To verify the fix works:

1. **Create a health record** with:
   - Diagnosis date: 5 days ago
   - Treatment start: 5 days ago
   - Treatment end: empty (ongoing)
   - Status should be: 'Sick'

2. **Edit the record** and set:
   - Treatment end: Today's date
   - Quarantine: false
   - Click save

3. **Verify:**
   - Status changes to 'Resolved' ✅
   - Table updates immediately ✅
   - Days since diagnosis recalculates ✅
   - Treatment duration calculates ✅

4. **Edit again** and set:
   - Quarantine: true
   - Treatment end: null (clear date)
   - Click save

5. **Verify:**
   - Status changes to 'Quarantined' ✅
   - is_active becomes true ✅
   - Treatment duration becomes null ✅

---

## Status

✅ **FIXED**
- Dynamic status calculation implemented
- All derived fields recalculated on update
- No compilation errors
- Ready for testing and deployment

---

**Fixed:** January 3, 2026
**File:** `app/health/health-page-client.tsx`
**Type:** Dynamic status calculation
