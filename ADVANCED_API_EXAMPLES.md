# Advanced API Usage Examples

## Real-World Integration Scenarios

### Scenario 1: Create Rabbit with Breeding Information

```typescript
// frontend/components/BreedingForm.tsx
'use client';

import { rabbitsApi } from '@/lib/api-client';
import { RabbitFormData } from '@/lib/validations/rabbit';

export function BreedingForm({ parentDoeId, parentBuckId, breedId, cageId }: {
  parentDoeId: string;
  parentBuckId: string;
  breedId: string;
  cageId: string;
}) {
  async function handleSubmit(formData: HTMLFormElement) {
    const data: RabbitFormData = {
      ear_tag_id: formData.ear_tag_id.value,
      name: formData.name.value || null,
      gender: formData.gender.value as 'Male' | 'Female',
      date_of_birth: formData.date_of_birth.value,
      breed_id: breedId,
      current_cage_id: cageId,
      status: 'Kit', // Newborn kits
      source_type: 'Born',
      parent_doe_id: parentDoeId,
      parent_buck_id: parentBuckId,
      is_pregnant: false,
    };

    try {
      const response = await rabbitsApi.create(data);
      console.log('Kit created:', response);
      // Success handling
    } catch (error) {
      console.error('Failed to create kit:', error);
      // Error handling
    }
  }

  return <form onSubmit={e => { e.preventDefault(); handleSubmit(e.target); }}>{/* form UI */}</form>;
}
```

---

### Scenario 2: Search & Filter Rabbits by Multiple Criteria

```typescript
// frontend/components/RabbitSearch.tsx
'use client';

import { useRabbitsQuery } from '@/hooks/useApi';
import { useState } from 'react';

export function RabbitSearch() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'Active',
    gender: 'Female',
    search: '',
  });

  const { data, isLoading, error, refetch } = useRabbitsQuery(filters);

  function handleFilterChange(newFilters: any) {
    setFilters({ ...filters, ...newFilters, page: 1 }); // Reset to page 1
    refetch();
  }

  function handlePageChange(page: number) {
    setFilters({ ...filters, page });
    refetch();
  }

  return (
    <div>
      <input
        placeholder="Search by tag or name"
        onChange={(e) => handleFilterChange({ search: e.target.value })}
      />
      <select onChange={(e) => handleFilterChange({ status: e.target.value })}>
        <option value="Active">Active</option>
        <option value="Sick">Sick</option>
        <option value="Quarantined">Quarantined</option>
      </select>

      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <div>
            {data.data.map((rabbit: any) => (
              <div key={rabbit._id}>
                {rabbit.ear_tag_id} - {rabbit.name} ({rabbit.gender})
              </div>
            ))}
          </div>

          {/* Pagination */}
          <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1}>
            Previous
          </button>
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(filters.page + 1)} 
            disabled={filters.page === data.pagination.totalPages}
          >
            Next
          </button>
        </>
      )}
    </div>
  );
}
```

---

### Scenario 3: Bulk Update Rabbit Status

```typescript
// frontend/lib/bulk-update.ts
import { rabbitsApi } from '@/lib/api-client';

export async function bulkUpdateRabbitStatus(
  rabbitIds: string[],
  newStatus: string
): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
  const results = {
    success: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  // Sequential updates (could be parallelized for better performance)
  for (const id of rabbitIds) {
    try {
      await rabbitsApi.update(id, { status: newStatus });
      results.success.push(id);
    } catch (error) {
      results.failed.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Usage
const { success, failed } = await bulkUpdateRabbitStatus(
  ['id1', 'id2', 'id3'],
  'Quarantined'
);

console.log(`Updated ${success.length} rabbits successfully`);
console.log(`Failed to update ${failed.length} rabbits:`, failed);
```

---

### Scenario 4: Create Breed with Validation

```typescript
// frontend/components/BreedForm.tsx
'use client';

import { breedsApi } from '@/lib/api-client';
import { BreedFormData } from '@/lib/validations/breed';
import { useState } from 'react';

export function BreedForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: HTMLFormElement) {
    setIsSubmitting(true);
    setError(null);

    const data: BreedFormData = {
      name: formData.name.value,
      description: formData.description.value || null,
      average_mature_weight_kg: parseFloat(formData.weight.value),
      maturity_age_days: parseInt(formData.maturity_age.value),
      weaning_age_days: parseInt(formData.weaning_age.value),
      grower_age_days: parseInt(formData.grower_age.value),
    };

    try {
      await breedsApi.create(data);
      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e.currentTarget); }}>
      {error && <p className="text-red-600">{error}</p>}
      
      <input name="name" required placeholder="Breed name" />
      <textarea name="description" placeholder="Description" />
      <input name="weight" type="number" step="0.1" required placeholder="Mature weight (kg)" />
      <input name="maturity_age" type="number" required placeholder="Maturity age (days)" />
      <input name="weaning_age" type="number" required placeholder="Weaning age (days)" />
      <input name="grower_age" type="number" required placeholder="Grower age (days)" />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Breed'}
      </button>
    </form>
  );
}
```

---

### Scenario 5: Optimistic Updates with Error Recovery

```typescript
// frontend/components/RabbitCard.tsx
'use client';

import { useRabbitMutations } from '@/hooks/useApi';
import { useState } from 'react';

export function RabbitCard({ rabbit, onUpdate }: {
  rabbit: any;
  onUpdate: (updated: any) => void;
}) {
  const [optimisticData, setOptimisticData] = useState(rabbit);
  const { update } = useRabbitMutations();

  async function handlePregnancyChange(isPregnant: boolean) {
    // Optimistic update
    const previousData = optimisticData;
    setOptimisticData({ ...optimisticData, is_pregnant: isPregnant });

    try {
      const response = await update.mutate(rabbit._id, { is_pregnant: isPregnant });
      // Confirm with server data
      setOptimisticData(response.data);
      onUpdate(response.data);
    } catch (error) {
      // Revert on error
      setOptimisticData(previousData);
      console.error('Failed to update:', error);
    }
  }

  return (
    <div>
      <h3>{optimisticData.ear_tag_id} - {optimisticData.name}</h3>
      <p>Status: {optimisticData.status}</p>
      <label>
        <input
          type="checkbox"
          checked={optimisticData.is_pregnant}
          onChange={(e) => handlePregnancyChange(e.target.checked)}
          disabled={update.isPending}
        />
        Pregnant
      </label>
      {update.error && <p className="text-red-600">{update.error.message}</p>}
    </div>
  );
}
```

---

### Scenario 6: Batch Create Cages

```typescript
// frontend/lib/cage-setup.ts
import { cagesApi } from '@/lib/api-client';
import { CageFormData } from '@/lib/validations/cage';

export async function setupCageStructure() {
  const cageConfigs: CageFormData[] = [
    // Tier A - Does
    { name: 'A1', location_area: 'Tier A', capacity: 6, cage_type: 'Doe' },
    { name: 'A2', location_area: 'Tier A', capacity: 6, cage_type: 'Doe' },
    { name: 'A3', location_area: 'Tier A', capacity: 6, cage_type: 'Doe' },
    // Tier B - Bucks
    { name: 'B1', location_area: 'Tier B', capacity: 4, cage_type: 'Buck' },
    { name: 'B2', location_area: 'Tier B', capacity: 4, cage_type: 'Buck' },
    // Quarantine
    { name: 'Q1', location_area: 'Quarantine', capacity: 3, cage_type: 'Quarantine' },
  ];

  const results = {
    created: [] as any[],
    failed: [] as { config: CageFormData; error: string }[],
  };

  for (const config of cageConfigs) {
    try {
      const response = await cagesApi.create(config);
      results.created.push(response.data);
      console.log(`✓ Created cage: ${config.name}`);
    } catch (error) {
      results.failed.push({
        config,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(`✗ Failed to create cage ${config.name}:`, error);
    }
  }

  return results;
}

// Usage in setup page
await setupCageStructure();
```

---

### Scenario 7: Real-Time Rabbit Status Dashboard

```typescript
// frontend/components/RabbitDashboard.tsx
'use client';

import { useRabbitsQuery } from '@/hooks/useApi';
import { useEffect, useState } from 'react';

export function RabbitDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data, refetch } = useRabbitsQuery({ status: 'Active' });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const stats = {
    total: data?.pagination.total || 0,
    males: data?.data.filter((r: any) => r.gender === 'Male').length || 0,
    females: data?.data.filter((r: any) => r.gender === 'Female').length || 0,
    pregnant: data?.data.filter((r: any) => r.is_pregnant).length || 0,
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 bg-blue-100">
        <h3>Total Active</h3>
        <p className="text-2xl">{stats.total}</p>
      </div>
      <div className="p-4 bg-green-100">
        <h3>Males</h3>
        <p className="text-2xl">{stats.males}</p>
      </div>
      <div className="p-4 bg-pink-100">
        <h3>Females</h3>
        <p className="text-2xl">{stats.females}</p>
      </div>
      <div className="p-4 bg-orange-100">
        <h3>Pregnant</h3>
        <p className="text-2xl">{stats.pregnant}</p>
      </div>

      <div className="col-span-4">
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (every 30s)
        </label>
        <button onClick={() => refetch()}>Manual Refresh</button>
      </div>
    </div>
  );
}
```

---

### Scenario 8: Export Rabbits to CSV

```typescript
// frontend/lib/export-csv.ts
import { rabbitsApi } from '@/lib/api-client';

export async function exportRabbitsToCSV(filters?: any) {
  try {
    // Fetch all records (paginate if needed)
    let allRabbits = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const response = await rabbitsApi.list({
        ...filters,
        page,
        limit,
      });

      allRabbits = allRabbits.concat(response.data);

      if (page === response.pagination.totalPages) break;
      page++;
    }

    // Convert to CSV
    const headers = [
      'Ear Tag ID',
      'Name',
      'Gender',
      'Date of Birth',
      'Status',
      'Breed',
      'Cage',
      'Pregnant',
    ];

    const rows = allRabbits.map((rabbit: any) => [
      rabbit.ear_tag_id,
      rabbit.name || '',
      rabbit.gender,
      new Date(rabbit.date_of_birth).toLocaleDateString(),
      rabbit.status,
      rabbit.breed?.name || '',
      rabbit.cage?.name || '',
      rabbit.is_pregnant ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rabbits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// Usage
<button onClick={() => exportRabbitsToCSV({ status: 'Active' })}>
  Export Active Rabbits
</button>
```

---

## Error Handling Patterns

### Pattern 1: Field-Level Validation Display

```typescript
import { rabbitsApi } from '@/lib/api-client';

try {
  await rabbitsApi.create(formData);
} catch (error: any) {
  // Display field-specific errors
  if (error.response?.data?.details) {
    const details = error.response.data.details;
    
    // Show errors next to form fields
    document.getElementById('ear_tag_id-error')!.textContent = 
      details.ear_tag_id?.join(', ') || '';
  }
}
```

### Pattern 2: Retry with Exponential Backoff

```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

// Usage
await retryWithBackoff(() => rabbitsApi.create(data));
```

---

## Performance Optimization Patterns

### Pattern 1: Infinite Scroll

```typescript
'use client';

import { useRabbitsQuery } from '@/hooks/useApi';
import { useEffect, useRef, useState } from 'react';

export function InfiniteRabbitList() {
  const [page, setPage] = useState(1);
  const [allRabbits, setAllRabbits] = useState<any[]>([]);
  const observerTarget = useRef(null);
  const { data } = useRabbitsQuery({ page, limit: 50 });

  useEffect(() => {
    if (data) {
      setAllRabbits((prev) =>
        page === 1 ? data.data : [...prev, ...data.data]
      );
    }
  }, [data, page]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && data?.pagination.page < data?.pagination.totalPages) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [data?.pagination]);

  return (
    <div>
      {allRabbits.map((rabbit) => (
        <div key={rabbit._id}>{rabbit.ear_tag_id} - {rabbit.name}</div>
      ))}
      <div ref={observerTarget}>Loading more...</div>
    </div>
  );
}
```

---

These examples demonstrate how to effectively use the backend API in real-world scenarios with proper error handling, performance optimization, and user experience patterns.
