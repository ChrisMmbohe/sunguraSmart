# Health Records - Quick Reference

## File Locations

| Component | Path |
|-----------|------|
| Page | [app/health/page.tsx](app/health/page.tsx) |
| Client | [app/health/health-page-client.tsx](app/health/health-page-client.tsx) |
| Types | [app/health/types.ts](app/health/types.ts) |
| Columns | [app/health/columns.tsx](app/health/columns.tsx) |
| Form | [components/HealthRecordForm.tsx](components/HealthRecordForm.tsx) |
| Modal | [components/HealthRecordModal.tsx](components/HealthRecordModal.tsx) |
| Data Fetcher | [lib/data-fetcher.ts](lib/data-fetcher.ts) |

## Key Interfaces

### HealthRecordTableData
Represents a health record in the table display:
- `rabbit_id`, `rabbit_tag_id`, `rabbit_full_name`
- `disease_id`, `disease_name`
- `date_of_diagnosis`, `treatment_start_date`, `treatment_end_date`
- `quarantined`, `notes`
- **Derived**: `is_active`, `current_status`, `days_since_diagnosis`, `treatment_duration_days`

### HealthRecordFormData
Form input data structure:
- `rabbit_id`, `disease_id` (select dropdowns)
- `date_of_diagnosis`, `treatment_start_date`, `treatment_end_date` (date inputs)
- `quarantined` (boolean checkbox)
- `notes` (text area)

## Data Fetcher Functions

### getHealthRecordsForTable()
```typescript
// Returns: HealthRecordTableData[]
// Fetches all health records with populated rabbit/disease names
// Calculates is_active, current_status, and duration fields
```

### getDiseasesForForm()
```typescript
// Returns: { _id: string; name: string; is_quarantinable: boolean }[]
// Used for disease dropdown in form
```

### getHealthStats()
```typescript
// Returns: { total_sick: number; quarantined: number; active_records: number }
// Summary statistics for dashboard cards
```

## Status Values

| Status | Meaning | Condition |
|--------|---------|-----------|
| Sick | Active health issue, not quarantined | `treatment_end_date === null && !quarantined` |
| Quarantined | Active health issue, isolated | `treatment_end_date === null && quarantined` |
| Treated | Completed treatment, recently | `treatment_end_date !== null && not yet resolved` |
| Resolved | Health issue resolved | `treatment_end_date < today` |

## Form Validation Rules

| Field | Required | Rules |
|-------|----------|-------|
| rabbit_id | ✅ | Must select a rabbit |
| disease_id | ✅ | Must select a disease |
| date_of_diagnosis | ✅ | Valid date required |
| treatment_start_date | ✅ | Must be ≥ diagnosis date |
| treatment_end_date | ❌ | If provided, must be ≥ start date |
| quarantined | ❌ | Auto-set if disease is quarantinable |
| notes | ❌ | Optional text |

## Color Scheme

| Status | Variant | Color |
|--------|---------|-------|
| Sick | destructive | Red |
| Quarantined | destructive | Red (with AlertTriangle icon) |
| Treated | secondary | Grey/Secondary |
| Resolved | default | Green/Primary |

## Icons Used (Lucide React)

- `Activity` - Sick status indicator
- `AlertTriangle` - Quarantine warning
- `Calendar` - Date fields
- `FileText` - Notes/error messages
- `Pill` - Health record form title
- `Stethoscope` - Modal title
- `Plus` - Add record button
- `ArrowUpDown` - Sortable column headers

## Component Props

### HealthRecordForm
```typescript
interface HealthRecordFormProps {
  rabbits: IRabbitOption[];
  diseases: IDiseaseOption[];
  onSubmit: (data: HealthRecordFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<HealthRecordFormData>;
  isLoading?: boolean;
}
```

### HealthRecordModal
```typescript
interface HealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: HealthRecordFormData) => Promise<void> | void;
  record?: HealthRecordTableData | null;
  rabbits: IRabbitOption[];
  diseases: IDiseaseOption[];
  mode?: 'view' | 'edit';
  isLoading?: boolean;
}
```

## API Integration Points

When implementing backend:

1. **Create Health Record** (POST)
   - Endpoint: `/api/health-records`
   - Body: `HealthRecordFormData`
   - Response: Created record with `_id`
   - Call from: `handleFormSubmit()` in health-page-client.tsx

2. **Update Health Record** (PUT)
   - Endpoint: `/api/health-records/{id}`
   - Body: `HealthRecordFormData`
   - Response: Updated record
   - Call from: `handleFormSubmit()` in edit mode

3. **Delete Health Record** (DELETE)
   - Endpoint: `/api/health-records/{id}`
   - Response: Success message
   - Future feature (not yet implemented)

## Summary Cards

Three dashboard cards showing:
1. **Sick Rabbits** - Count of unique rabbits with active health records
2. **Quarantined** - Count of quarantined records
3. **Total Records** - All health records in system

## Table Features

- **Sorting**: Click column headers (Rabbit Tag, Diagnosis Date, Days Since)
- **Searching**: Search by rabbit tag ID or disease name
- **Pagination**: Configurable page size (10, 20, 30, 40, 50)
- **Row Click**: Opens modal with full details
- **Column Toggle**: Toggle visible columns (if enabled)

## Responsive Breakpoints

- **Mobile** (< 640px): Single column cards, scrollable table
- **Tablet** (640px - 1024px): Two column cards, adjusted spacing
- **Desktop** (> 1024px): Three column cards, full layout

## Known Limitations (Current State)

- Backend endpoints not yet implemented (frontend ready)
- No real-time sync of rabbit status changes
- No email notifications on quarantine
- No batch operations (delete multiple)
- No health record templates
- No export to PDF/CSV

## Testing Data Model

To test the form and modal:
```typescript
// Mock health record
const testRecord: HealthRecordTableData = {
  _id: "123",
  rabbit_id: "456",
  rabbit_tag_id: "A1-001",
  rabbit_full_name: "A1-001 - Fluffy",
  disease_id: "789",
  disease_name: "Coccidiosis",
  date_of_diagnosis: new Date("2025-12-20"),
  treatment_start_date: new Date("2025-12-20"),
  treatment_end_date: null,
  quarantined: true,
  notes: "Started treatment with Sulfadimethoxine",
  is_active: true,
  current_status: "Quarantined",
  days_since_diagnosis: 5,
  treatment_duration_days: null
};
```

## Styling Classes Used

- Tailwind CSS utility classes
- Card, Badge, Button, Dialog components from shadcn/ui
- Custom CSS in globals.css
- No external CSS required
- Supports light/dark mode via theme context
