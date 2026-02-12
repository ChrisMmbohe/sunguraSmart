# Dynamic Status Calculation - Testing Guide

## Quick Test (5 minutes)

### Test Case 1: Ongoing Treatment Remains Sick
```
1. Find a health record with:
   - treatment_end_date: null (empty)
   - quarantined: false
   - Current status: 'Sick'

2. Edit the record
3. Don't change any fields
4. Click "Save Health Record"

Expected: Status remains 'Sick' ✅
```

### Test Case 2: Mark as Resolved
```
1. Find a health record with:
   - treatment_end_date: null (empty)
   - Current status: 'Sick'

2. Edit the record
3. Set treatment_end_date to TODAY or PAST
4. Keep quarantined: false
5. Click "Save Health Record"

Expected: Status changes to 'Resolved' ✅
```

### Test Case 3: Mark as Quarantined
```
1. Find a health record with:
   - treatment_end_date: null (empty)
   - quarantined: false
   - Current status: 'Sick'

2. Edit the record
3. Check the "Mark as Quarantined" checkbox
4. Click "Save Health Record"

Expected: Status changes to 'Quarantined' ✅
```

### Test Case 4: Complete Treatment (Future End Date)
```
1. Create a new health record or edit existing
2. Set dates:
   - treatment_end_date: 30 days in FUTURE
   - quarantined: false
3. Click "Save Health Record"

Expected: Status = 'Treated' ✅
(Shows treatment is scheduled to end in the future)
```

---

## Specific Test: Record K1-019-4-393

If this record exists, test it specifically:

```
1. Navigate to /health
2. Find record: K1-019-4-393
3. Click the row to view details
4. Click "Edit" button

5. Make a change:
   a) Set treatment_end_date to past date (e.g., Jan 1, 2025)
   OR
   b) Check/uncheck quarantine box

6. Click "Save Health Record"
7. Observe status update
8. Verify table reflects new status immediately
```

---

## Comprehensive Test Checklist

### Basic Updates
- [ ] Edit record with no date changes → Status stays same
- [ ] Edit record, set end_date to today → Status = 'Resolved'
- [ ] Edit record, set end_date to past → Status = 'Resolved'
- [ ] Edit record, set end_date to future → Status = 'Treated'
- [ ] Edit record, clear end_date → Status = 'Sick' (if not quarantined)
- [ ] Edit record, toggle quarantine → Status = 'Quarantined' (if ongoing)

### Status Values
- [ ] Status = 'Sick': ongoing treatment, not quarantined
- [ ] Status = 'Quarantined': ongoing treatment, quarantined
- [ ] Status = 'Treated': treatment ended, end_date in future
- [ ] Status = 'Resolved': treatment ended, end_date in past

### Derived Fields
- [ ] `is_active` updates correctly (null end_date = true)
- [ ] `days_since_diagnosis` recalculates
- [ ] `treatment_duration_days` recalculates correctly
- [ ] All changes reflect in table immediately

### UI Updates
- [ ] Toast notification shows "updated successfully"
- [ ] Modal closes after save
- [ ] Table row updates without refresh
- [ ] Badge color changes if status changed

---

## Manual Verification Steps

### Step 1: Check Table Display
```
1. Look at the 'Status' column in health records table
2. After editing and saving, confirm the status badge:
   - 'Sick' = Red/Destructive styling
   - 'Quarantined' = Red/Destructive styling (with icon)
   - 'Treated' = Secondary styling
   - 'Resolved' = Default styling
```

### Step 2: Check Modal Display
```
1. Click a row to view details
2. Check the "Disease Information" section
3. The "Current Status" badge should match table
4. If you edit and save, status should update when you reopen
```

### Step 3: Check Database (Optional)
```
MongoDB Query:
db.healthrecords.findOne({ "rabbit_id": "..." })

Verify:
- treatment_end_date is set correctly
- quarantined flag is correct
- No errors in logs
```

---

## Expected Behaviors

### Behavior 1: Immediate Update
```
Action: Edit record and save
Expected: Table updates WITHOUT page refresh
Result: ✅ Status reflects new values immediately
```

### Behavior 2: Consistent Logic
```
Action: Edit same record twice with same values
Expected: Status should be same both times
Result: ✅ Status is consistent
```

### Behavior 3: Past vs Future Dates
```
Action 1: Set end_date to 1 month ago, save
Result: Status = 'Resolved' ✅

Action 2: Set end_date to 1 month future, save
Result: Status = 'Treated' ✅

Logic: Respects TODAY's date for comparison
```

### Behavior 4: Quarantine Logic
```
If ongoing (no end date):
  - Quarantine ON → Status = 'Quarantined'
  - Quarantine OFF → Status = 'Sick'

If completed:
  - Quarantine flag ignored (treatment is done)
  - Status determined by end date only
```

---

## Troubleshooting

### Issue: Status didn't change after save
**Possible Causes:**
1. Page still cached - Hard refresh (Ctrl+Shift+R)
2. Form validation error - Check toast for error message
3. Status was already correct - Verify expected status

**Solution:**
```
1. Clear browser cache
2. Hard refresh the page
3. Try editing again
4. Check browser console for errors
```

### Issue: Status incorrect for a record
**Check:**
1. What is the treatment_end_date?
2. Is today's date after that date? (determines Resolved vs Treated)
3. Is quarantined checkbox checked? (determines Quarantined vs Sick)
4. Is treatment_end_date null? (determines if ongoing)

**Verify Logic:**
- Ongoing + Quarantined = 'Quarantined' ✓
- Ongoing + Not Quarantined = 'Sick' ✓
- Completed + Past Date = 'Resolved' ✓
- Completed + Future Date = 'Treated' ✓

---

## Success Criteria

✅ All status values display correctly
✅ Status updates immediately after save
✅ Derived fields calculate correctly
✅ No page refresh needed
✅ Consistent with same logic as data-fetcher.ts
✅ Record K1-019-4-393 and others work correctly

---

**Test Date:** January 3, 2026
**Component:** `app/health/health-page-client.tsx`
**Feature:** Dynamic status calculation
