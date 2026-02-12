# Health Records - Architecture & Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interface Layer                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐         │
│  │   Health Page        │      │  Rabbits Page        │         │
│  │  (Server Component)  │      │ (with Health Icons)  │         │
│  └──────────┬───────────┘      └──────────────────────┘         │
│             │                                                    │
│             └─────────────────┬────────────────────────────────┘
│                               │
├──────────────────────────────┼────────────────────────────────┤
│                 Client Layer                                    │
│  ┌────────────────────────────┴────────────────────────────┐   │
│  │         HealthPageClient Component                      │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │  Add Button     │  │  DataTable with Columns     │   │   │
│  │  └────────┬────────┘  │  - Searchable/Sortable      │   │   │
│  │           │            │  - Click to Open Modal      │   │   │
│  │  ┌────────v─────────────┐                           │   │   │
│  │  │  HealthRecordModal   │                           │   │   │
│  │  │  ┌─────────────────┐ │  └─────────────────────────┘   │   │
│  │  │  │  View Mode      │ │                                │   │
│  │  │  │  (Read-Only)    │ │                                │   │
│  │  │  └────────┬────────┘ │                                │   │
│  │  │           │ [Edit]   │                                │   │
│  │  │  ┌────────v─────────┐│                                │   │
│  │  │  │ HealthRecordForm ││                                │   │
│  │  │  │ (Edit Mode)      ││                                │   │
│  │  │  └──────────────────┘│                                │   │
│  │  └─────────────────────────┘                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│              Server-Side Data Fetching Layer                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Data Fetcher Functions (lib/data-fetcher.ts)           │   │
│  │  ├─ getHealthRecordsForTable()                          │   │
│  │  ├─ getDiseasesForForm()                                │   │
│  │  ├─ getHealthStats()                                    │   │
│  │  └─ getRabbitsForForm()  [existing]                     │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
├─────────────────────────┼─────────────────────────────────────────┤
│              MongoDB Database Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Collections                                             │   │
│  │  ├─ HealthRecord (primary)                             │   │
│  │  │   - rabbit_id (ref: Rabbit)                         │   │
│  │  │   - disease_id (ref: Disease)                       │   │
│  │  │   - date_of_diagnosis, treatment dates              │   │
│  │  │   - quarantined, notes                              │   │
│  │  │                                                      │   │
│  │  ├─ Rabbit (populated)                                 │   │
│  │  │   - ear_tag_id, name, status                        │   │
│  │  │   - [status updated by health records]              │   │
│  │  │                                                      │   │
│  │  └─ Disease (referenced)                               │   │
│  │      - name, symptoms, is_quarantinable                │   │
│  │                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Actions                    Component State                Database
    │                                │                            │
    ├─ Click Row         ────────> selectedRecord               │
    │                            + modalMode = 'view'           │
    │                                │                            │
    ├─ Click Edit        ────────> modalMode = 'edit'           │
    │                                │                            │
    ├─ Fill Form         ────────> formData state updates       │
    │                                │                            │
    ├─ Click Save        ────────> handleFormSubmit()           │
    │                                │                            │
    │                                └──────> API Call          │
    │                                         (future)  ────────> INSERT/UPDATE
    │                                                             │
    ├─ Click Close       ────────> modalOpen = false            │
    │                            selectedRecord = null          │
    │                                                             │
    └─ Page Load         ────────────────────────────────────────> FETCH ALL
                                                        Transform:
                                                        - Populate rabbit/disease
                                                        - Calculate is_active
                                                        - Determine status
                                                        - Count days, duration
```

## Component State Management

```
HealthPageClient
├── isModalOpen: boolean
│   ├─ true  → HealthRecordModal rendered
│   └─ false → modal hidden
├── selectedRecord: HealthRecordTableData | null
│   └─ null when adding new, populated when editing
├── modalMode: 'view' | 'edit'
│   ├─ 'view' → Read-only display
│   └─ 'edit' → Form input enabled

HealthRecordForm
├── formData: HealthRecordFormData
│   ├─ rabbit_id
│   ├─ disease_id
│   ├─ date_of_diagnosis
│   ├─ treatment_start_date
│   ├─ treatment_end_date
│   ├─ quarantined
│   └─ notes
├── errors: Record<string, string>
│   └─ Field validation error messages
└── submitting: boolean
    └─ true while submitting, shows loading state

HealthRecordModal
├── isOpen: boolean
├── selectedRecord: HealthRecordTableData | null
└── editMode: boolean
```

## Page Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Header (SiteHeader)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        Summary Cards (3-column grid)                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │  Sick (red) │ │ Quarantined │ │Total Records│   │   │
│  │  │      5      │ │   (amber)   │ │      42     │    │   │
│  │  │             │ │       2     │ │             │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [+ New Health Record Button]        [Search Box]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DataTable (Scrollable)                             │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Rabbit | Disease | Diag.Date | Treat.Period │   │   │
│  │  ├──────────────────────────────────────────────┤   │   │
│  │  │ A1-001 │ Coccid | Dec 20,25 | Dec 20 - 24  │   │   │
│  │  │ A1-002 │ Snuffles│Dec 22,25 │ Dec 22 - ...  │   │   │
│  │  │ ... more rows ...                            │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  Pagination: [< 1 2 3 >] Items per page [10 ▼]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Footer (Sidebar)                        │
└─────────────────────────────────────────────────────────────┘
```

## Modal Views

### View Mode
```
┌─────────────────────────────────────────┐
│ Health Record Details      [×]           │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Rabbit Information ────────────────┐ │
│ │ Rabbit Tag ID: A1-001              │ │
│ │ Full Name: A1-001 - Fluffy         │ │
│ └────────────────────────────────────┘ │
│                                         │
│ ┌─ Disease Information ──────────────┐ │
│ │ Disease Name: Coccidiosis          │ │
│ │ Status: [Sick]                     │ │
│ └────────────────────────────────────┘ │
│                                         │
│ ┌─ Timeline ─────────────────────────┐ │
│ │ Diagnosis: December 20, 2025       │ │
│ │ Treatment: Dec 20 - 24, 2025       │ │
│ └────────────────────────────────────┘ │
│                                         │
│ ┌─ Notes ────────────────────────────┐ │
│ │ Started with Sulfadimethoxine...   │ │
│ └────────────────────────────────────┘ │
│                                         │
│            [Edit]  [Close]              │
└─────────────────────────────────────────┘
```

### Edit Mode
```
┌─────────────────────────────────────────┐
│ Health Record        [×]                │
├─────────────────────────────────────────┤
│                                         │
│ Rabbit * [Dropdown ▼]                  │
│                                         │
│ Disease * [Dropdown ▼]                 │
│                                         │
│ Diagnosis Date * [Date Picker]         │
│                                         │
│ Treatment Start Date * [Date Picker]   │
│                                         │
│ Treatment End Date (Optional) [Date]   │
│                                         │
│ ☐ Mark as Quarantined                  │
│                                         │
│ Notes (Optional)                        │
│ [Text Area.....................]       │
│                                         │
│ [Save Health Record] [Cancel]          │
└─────────────────────────────────────────┘
```

## Health Status State Machine

```
    New Record
        │
        ├─ diagnosis_date set
        │
        └─ treatment_start_date set
            │
            ├─ treatment_end_date is NULL
            │   ├─ is_active = true
            │   │
            │   └─ quarantined?
            │       ├─ true  → Status: "Quarantined" (🔴)
            │       └─ false → Status: "Sick" (🔴)
            │
            └─ treatment_end_date is SET
                ├─ end_date < today
                │   └─ Status: "Resolved" (🟢)
                │
                └─ end_date >= today
                    └─ Status: "Treated" (🟡)
```

## Integration Points with Rabbit Status

```
Rabbit Status Updates:
┌─────────────────────────┐
│  Health Record Created  │
│  (treatment ongoing)    │
└────────────┬────────────┘
             │
             ├─ quarantined = true
             │  └────> Rabbit.status = "Quarantined"
             │
             └─ quarantined = false
                └────> Rabbit.status = "Sick"


Rabbit Status Recovery:
┌─────────────────────────┐
│  Treatment Completed    │
│  (end_date set)         │
└────────────┬────────────┘
             │
             └────> Re-evaluate Rabbit.status
                   (Check for other active health records)
                   └─ if none → Restore previous status
                     (Kit/Weaner/Grower/Active)
```

## Data Transformation Pipeline

```
Raw MongoDB Document
    ↓
  [Mongoose Lean Query]
    ↓
  [Populate Fields]
  - rabbit_id → Full Rabbit object
  - disease_id → Full Disease object
    ↓
  [Transform & Enrich]
  - Extract rabbit_tag_id, rabbit_full_name
  - Extract disease_name
  - Calculate is_active (treatment_end_date === null)
  - Calculate current_status (Sick/Quarantined/Treated/Resolved)
  - Calculate days_since_diagnosis
  - Calculate treatment_duration_days
    ↓
  [HealthRecordTableData]
  Ready for display
```

## Color & Icon Legend

```
Status Badge        Color       Icon              Animation
─────────────────────────────────────────────────────────────
Sick                Red (🔴)    Activity          Pulse
Quarantined         Red (🔴)    AlertTriangle     Pulse
Treated             Grey (⚪)    —                 None
Resolved            Green (🟢)  —                 None

UI Element          Color       Icon
─────────────────────────────────────────────────────────────
Add Button          Primary     Plus
Form Title          Neutral     Pill
Modal Title         Neutral     Stethoscope
Date Input          Neutral     Calendar
Notes Field         Neutral     FileText
Quarantine Warning  Amber       AlertTriangle
Delete Action       Red         Trash (future)
```

## Responsive Breakpoints

```
Mobile (< 640px)
┌─────────────────┐
│ Single Column   │
│  Summary Cards  │
├─────────────────┤
│ Stacked Table   │
│ (scrollable)    │
└─────────────────┘

Tablet (640px - 1024px)
┌────────────────────────────┐
│   Two Column Summary Cards  │
├────────────────────────────┤
│ Partial Table (scrollable) │
└────────────────────────────┘

Desktop (> 1024px)
┌──────────────────────────────────────┐
│   Three Column Summary Cards         │
├──────────────────────────────────────┤
│ Full Table (all columns visible)    │
└──────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Type-safe data flow
- ✅ Scalable to backend integration
- ✅ Responsive across all devices
- ✅ Accessibility compliance
