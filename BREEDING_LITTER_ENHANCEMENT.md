# Breeding & Litter Management Enhancement

## Overview
This document outlines the complete enhancement of the Sunguch application with dedicated interfaces for managing breeding events and litter records.

## ✅ Completed Features

### 1. Breeding Management (`/app/breeding/`)

#### Files Created:
- **`types.ts`** - TypeScript interfaces for breeding table data
  - `BreedingTableData`: Table display format with calculated fields
  - `BreedingStatus`: Union type for "Pending" | "Successful" | "Failed"
  
- **`columns.tsx`** - TanStack React Table column definitions (7 columns)
  - Doe name (sortable)
  - Buck name (sortable)
  - Mating date (sortable)
  - Expected kindling date (sortable)
  - Days since mating (sortable)
  - Status badge (Pending = amber, Successful = green, Failed = red)
  - Litter indicator (linked/no litter)

- **`breeding-page-client.tsx`** - Client-side orchestrator component
  - Summary cards: Total Breedings, Successful Count, Pending Count, Kindling Rate (%)
  - Form sheet modal for adding new breeding records
  - DataTable with sorting and responsive design
  - Status messages (success/error notifications)
  - Empty state with call-to-action
  
- **`page.tsx`** - Server component for data fetching
  - Parallel data fetching: `Promise.all([getBreedingsForTable(), getRabbitsForForm()])`
  - Error handling and display
  - Layout with AppSidebar and SiteHeader
  - Passes data to BreedingPageClient component

#### Component Features:
- **BreedingForm.tsx** (in `/components/`)
  - Doe selection dropdown (filters to female rabbits only)
  - Buck selection dropdown (filters to male rabbits only)
  - Mating date picker with auto-calculation of expected kindling date (+31 days)
  - Success checkbox to mark breeding as confirmed kindling
  - Validation: prevents selecting same doe and buck, validates required fields
  - Error display with accessibility labels
  - Keyboard navigation support

#### Data Transformation:
- `getBreedingsForTable()` fetches breedings with calculated fields:
  - `days_since_mating`: Current date minus mating date
  - `status`: Determined by is_successful flag and days elapsed
    - Successful: If is_successful = true
    - Failed: If > 35 days and not successful
    - Pending: Otherwise

---

### 2. Litter Management (`/app/litters/`)

#### Files Created:
- **`types.ts`** - TypeScript interfaces for litter table data
  - `LitterTableData`: Table display format with calculated fields
  - `LitterStatus`: Union type for "Active" | "Weaned" | "Closed"
  
- **`columns.tsx`** - TanStack React Table column definitions (8 columns)
  - Doe name (sortable)
  - Buck name (sortable)
  - Kindling date (sortable)
  - Total kits born (sortable)
  - Kits surviving (sortable)
  - Survival rate % with color coding:
    - Green: >= 90% survival
    - Amber: >= 70% survival
    - Red: < 70% survival
  - Days old since kindling (sortable)
  - Status badge (Active = blue, Weaned = amber, Closed = gray)

- **`litters-page-client.tsx`** - Client-side orchestrator component
  - Summary cards: Total Litters, Active Count, Total Kits Born, Avg Survival Rate (%)
  - Form sheet modal for recording new litter
  - DataTable with sorting and responsive design
  - Status messages (success/error notifications)
  - Empty state with guidance and call-to-action
  
- **`page.tsx`** - Server component for data fetching
  - Parallel data fetching: `Promise.all([getLittersForTable(), getBreedingsForForm()])`
  - Error handling and display
  - Layout with AppSidebar and SiteHeader
  - Passes data to LittersPageClient component

#### Component Features:
- **LitterForm.tsx** (in `/components/`)
  - Breeding selection dropdown (displays doe × buck format for clarity)
  - Kindling date picker
  - Total kits born number input
  - Kits surviving number input with validation (surviving <= born)
  - Weaning date picker (optional, disabled if not yet weaned)
  - Status dropdown (Active/Weaned/Closed) with label hints
  - Live survival rate display (calculated: surviving/born * 100)
  - Comprehensive validation with error messages
  - Keyboard navigation support

#### Data Transformation:
- `getLittersForTable()` fetches litters with calculated fields:
  - `days_old`: Current date minus kindling date
  - `survival_rate`: (kits_surviving / total_kits_born) * 100
  - Properly populated doe/buck names via population

---

### 3. Data Fetcher Enhancements (`/lib/data-fetcher.ts`)

#### New Functions:
1. **`getBreedingsForTable()`**
   - Fetches all breedings with doe and buck population
   - Maps to BreedingTableData format
   - Calculates: days_since_mating, status determination
   - Returns sorted by mating_date DESC

2. **`getLittersForTable()`**
   - Fetches all litters with doe and buck population
   - Maps to LitterTableData format
   - Calculates: days_old, survival_rate
   - Returns sorted by kindling_date DESC

3. **`getRabbitsForForm()`**
   - Fetches all rabbits with minimal fields (_id, ear_tag_id, name, gender)
   - Returns IRabbitOption[] for filtering in forms
   - Enables gender-based filtering in BreedingForm

4. **`getBreedingsForForm()`**
   - Fetches breedings with doe/buck population
   - Maps to IBreedingOption format
   - Returns [doe_name × buck_name] format for litter form dropdowns
   - Returns sorted by mating_date DESC

#### Type Exports:
- `IRabbitOption`: { _id, ear_tag_id, name, gender }
- `IBreedingOption`: { _id, doe_name, buck_name, mating_date }

---

### 4. Sidebar Navigation Update

#### Changes to `/components/app-sidebar.tsx`:
- Added "Breeding" menu item between Rabbits and Litters
- URL: `/breeding`
- Icon: 🔗 (link emoji representing breeding connection)
- Maintains consistent ordering with breeding → litters workflow

---

## 🏗️ Architecture Overview

### Component Hierarchy:
```
page.tsx (Server - Data Fetching)
  ↓
BreedingPageClient (Client - UI Orchestration)
  ├── Summary Cards (Statistics)
  ├── Sheet Modal with BreedingForm
  ├── DataTable (columns + data)
  └── Empty State

page.tsx (Server - Data Fetching)
  ↓
LittersPageClient (Client - UI Orchestration)
  ├── Summary Cards (Statistics)
  ├── Sheet Modal with LitterForm
  ├── DataTable (columns + data)
  └── Empty State
```

### Data Flow:
```
page.tsx (async)
  ↓
Promise.all([
  getBreedingsForTable(),
  getBreedingsForForm()
])
  ↓
BreedingPageClient (receives initialData, rabbitsForForm)
  ↓
BreedingForm (uses rabbitsForForm for dropdowns)
  ↓
DataTable (displays columns mapped over data)
```

---

## 🎨 UI/UX Features

### Responsive Design:
- Mobile-first approach with Tailwind CSS
- Summary cards stack on mobile, grid layout on desktop (md:grid-cols-4)
- Sheet modal adjusts width: `sm:max-w-2xl`
- DataTable scrolls horizontally on small screens

### Accessibility:
- ARIA labels for form inputs
- Keyboard navigation: Tab, Arrow keys, Enter
- Color-coded status badges with text labels
- Semantic HTML with Label components
- Error messages associated with inputs via htmlFor

### Visual Feedback:
- Status badges with distinct colors (green/amber/red)
- Alert boxes for error/success states with icons
- Loading skeletons for initial page load
- Empty states with guidance text
- Form validation with inline error messages

---

## 📊 Data Models

### Breeding Record:
```typescript
{
  _id: ObjectId
  doe_id: ObjectId (references Rabbit)
  buck_id: ObjectId (references Rabbit)
  mating_date: Date
  expected_kindling_date: Date (calculated: +31 days)
  is_successful: Boolean (kindling confirmed)
  litter_id: ObjectId | null (references Litter)
}
```

### Litter Record:
```typescript
{
  _id: ObjectId
  breeding_id: ObjectId (references Breeding)
  doe_id: ObjectId (references Rabbit)
  buck_id: ObjectId (references Rabbit)
  kindling_date: Date
  total_kits_born: Number
  kits_surviving: Number
  weaning_date: Date | null
  status: "Active" | "Weaned" | "Closed"
}
```

---

## 🔄 User Workflows

### Recording a Breeding:
1. Navigate to `/breeding`
2. Click "Record Breeding" button
3. Select doe (filtered to females)
4. Select buck (filtered to males)
5. Pick mating date
6. Expected kindling date auto-calculates
7. Optional: Mark as successful if kindling confirmed
8. Submit form → Shows success message
9. DataTable updates with new breeding record

### Recording a Litter:
1. Navigate to `/litters`
2. Click "Record Litter" button
3. Select breeding event (shows doe × buck)
4. Enter kindling date
5. Enter total kits born
6. Enter kits surviving (validates: must be ≤ born)
7. Optional: Add weaning date if already weaned
8. Select status (Active/Weaned/Closed)
9. Survival rate displays automatically
10. Submit form → Shows success message
11. DataTable updates with new litter record

---

## 🔍 Status Logic

### Breeding Status:
- **Pending**: Breeding recorded but kindling not yet confirmed (< 35 days)
- **Successful**: Litter born (is_successful = true)
- **Failed**: 35+ days passed without successful kindling

### Litter Status:
- **Active**: Kits being reared by doe
- **Weaned**: Kits separated from doe, weaning_date set
- **Closed**: Litter no longer tracked (sold/culled)

---

## 🛠️ Technical Stack

- **Framework**: Next.js 16 (App Router)
- **UI Framework**: React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React 0.553
- **Tables**: TanStack React Table 8.21.3
- **Dates**: date-fns 4.1.0
- **Database**: MongoDB + Mongoose 8.19.3

---

## ✨ Key Improvements

1. **Centralized Data Fetching**: All breeding/litter functions in `data-fetcher.ts` for consistency
2. **Type Safety**: Full TypeScript types for all interfaces and functions
3. **Performance**: Server-side rendering for data fetching, parallel fetches with Promise.all()
4. **User Experience**: Auto-calculations (kindling date, survival rate), status indicators, responsive design
5. **Error Handling**: Try-catch blocks, user-friendly error messages
6. **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
7. **Consistency**: Pattern matches existing rabbits page, unified UI/UX

---

## 📝 Notes for Developers

### Adding Modal Details Components (Future):
To add detail modals for individual breeding/litter records:
1. Create `BreedingDetailsModal.tsx` in `/components/`
2. Create `LitterDetailsModal.tsx` in `/components/`
3. Update columns to add click handlers
4. Pass modal open/close handlers to client components

### Backend Integration (Future):
The forms currently log data and show success messages without API calls.
To integrate with backend:
1. Create API routes: `/api/breeding/route.ts`, `/api/litters/route.ts`
2. Update `handleFormSubmit()` in page clients to call fetch()
3. Add optimistic updates to DataTable state
4. Implement error boundary for API failures

### Database Seeding (Future):
To add sample breeding/litter data for testing:
1. Update `/database/seed/seed-breeding.ts`
2. Update `/database/seed/seed-logs.ts` for litter relationships
3. Run seed command to populate development database

---

## 📋 Checklist

- [x] Breeding types definition
- [x] Breeding table columns
- [x] Breeding form component
- [x] Breeding page client
- [x] Breeding page server
- [x] Litter types definition
- [x] Litter table columns
- [x] Litter form component
- [x] Litter page client
- [x] Litter page server
- [x] Data fetcher enhancements
- [x] Sidebar navigation update
- [x] TypeScript validation (no errors)
- [ ] Backend API integration (future)
- [ ] Detail modals (future)
- [ ] E2E tests (future)

---

## 🚀 Next Steps

1. **Test in Development**: Navigate to `/breeding` and `/litters` pages
2. **API Integration**: Connect forms to backend endpoints
3. **Detail Modals**: Add click handlers to view full breeding/litter records
4. **Notifications**: Integrate with toast notifications for better UX
5. **Advanced Filtering**: Add date range filters, status filters to tables
6. **Analytics**: Add charts for breeding success rates, litter survival trends

