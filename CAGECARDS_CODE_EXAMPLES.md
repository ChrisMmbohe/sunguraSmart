# Cage Cards - Code Examples & Snippets

This document provides practical code examples for working with and extending the Cage Cards feature.

---

## Table of Contents
1. [Component Usage](#component-usage)
2. [State Management](#state-management)
3. [Event Handlers](#event-handlers)
4. [Customization](#customization)
5. [API Integration](#api-integration)
6. [Testing Examples](#testing-examples)
7. [Extending Features](#extending-features)

---

## Component Usage

### Basic Implementation
```typescript
'use client';

import CageCardsPage from '@/app/cagecards/page';

// Simply render the page component
export default function Page() {
  return <CageCardsPage />;
}
```

### Accessing from Navigation
Add link to sidebar or navigation menu:
```typescript
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/cagecards" className="menu-item">
        <QrCode className="h-4 w-4" />
        Cage Cards
      </Link>
    </nav>
  );
}
```

---

## State Management

### Core State Variables
```typescript
// UI State
const [activeTab, setActiveTab] = useState('view');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [printDialogOpen, setPrintDialogOpen] = useState(false);

// Data State
const [rabbits, setRabbits] = useState<RabbitData[]>([]);
const [filteredRabbits, setFilteredRabbits] = useState<RabbitData[]>([]);
const [generatedCards, setGeneratedCards] = useState<CageCardData[]>([]);

// Selection State
const [selectedRabbits, setSelectedRabbits] = useState<string[]>([]);
const [selectedCardsToPrint, setSelectedCardsToPrint] = useState<string[]>([]);

// Customization State
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState<string>('all');
const [filterGender, setFilterGender] = useState<string>('all');
const [customNotes, setCustomNotes] = useState('');
const [includePedigree, setIncludePedigree] = useState(true);
const [includeHealth, setIncludeHealth] = useState(true);
```

### Resetting State
```typescript
const resetAllState = () => {
  setSearchTerm('');
  setFilterStatus('all');
  setFilterGender('all');
  setSelectedRabbits([]);
  setSelectedCardsToPrint([]);
  setGeneratedCards([]);
  setCustomNotes('');
  setIncludePedigree(true);
  setIncludeHealth(true);
  setActiveTab('view');
};
```

---

## Event Handlers

### Search & Filter Handler
```typescript
// Example: Custom filter logic
const applyAdvancedFilter = (filterConfig: {
  search?: string;
  status?: string[];
  gender?: string[];
  ageMin?: number;
  ageMax?: number;
}) => {
  let filtered = rabbits.filter(rabbit => {
    // Search condition
    if (filterConfig.search) {
      const matches = 
        rabbit.ear_tag_id.includes(filterConfig.search) ||
        rabbit.name?.includes(filterConfig.search) ||
        rabbit.breed_name.includes(filterConfig.search);
      if (!matches) return false;
    }

    // Status condition
    if (filterConfig.status && filterConfig.status.length > 0) {
      if (!filterConfig.status.includes(rabbit.status)) return false;
    }

    // Gender condition
    if (filterConfig.gender && filterConfig.gender.length > 0) {
      if (!filterConfig.gender.includes(rabbit.gender)) return false;
    }

    return true;
  });

  setFilteredRabbits(filtered);
};
```

### Generate Cards Handler (Extended)
```typescript
const handleGenerateCardsWithValidation = () => {
  // Validation
  if (selectedRabbits.length === 0) {
    toast.error('No rabbits selected');
    return;
  }

  if (customNotes.length > 150) {
    toast.error('Notes exceed 150 characters');
    return;
  }

  // Rate limiting (optional)
  if (selectedRabbits.length > 100) {
    toast.warning('Generating 100+ cards may take a moment...');
  }

  try {
    const newCards = selectedRabbits.map(rabbitId => {
      const rabbit = rabbits.find(r => r._id === rabbitId);
      if (!rabbit) throw new Error(`Rabbit ${rabbitId} not found`);

      return {
        id: `${rabbitId}-${Date.now()}-${Math.random()}`, // More unique
        rabbitId,
        rabbitTag: rabbit.ear_tag_id,
        rabbitName: rabbit.name || 'Unnamed',
        breed: rabbit.breed_name,
        gender: rabbit.gender,
        dateOfBirth: formatDate(rabbit.date_of_birth),
        status: rabbit.status,
        cageId: rabbit.cage_id,
        includePedigree,
        includeHealth,
        customNotes: customNotes.trim(), // Trim whitespace
        qrCodeUrl: generateQRCodeUrl(rabbitId),
        photoUrl: rabbit.photo_url,
      };
    }).filter(Boolean) as CageCardData[];

    setGeneratedCards(prev => [...prev, ...newCards]);
    setSelectedRabbits([]);
    setCustomNotes('');
    
    toast.success(`Generated ${newCards.length} card(s)`, {
      description: `Total: ${generatedCards.length + newCards.length} cards`,
    });
    
    setActiveTab('generate');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    toast.error(message);
  }
};

// Helper function for date formatting
const formatDate = (date: string | Date): string => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};
```

### Batch Operations
```typescript
// Select/Deselect all visible rabbits
const toggleSelectAll = () => {
  if (selectedRabbits.length === filteredRabbits.length) {
    // Deselect all
    setSelectedRabbits([]);
  } else {
    // Select all visible
    setSelectedRabbits(filteredRabbits.map(r => r._id));
  }
};

// Clear all generated cards
const clearAllCards = () => {
  if (window.confirm('Delete all generated cards? This cannot be undone.')) {
    setGeneratedCards([]);
    setSelectedCardsToPrint([]);
    toast.success('All cards cleared');
  }
};

// Export cards to JSON (for future persistence)
const exportCardsAsJSON = () => {
  const data = JSON.stringify(generatedCards, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cage-cards-${new Date().toISOString()}.json`;
  link.click();
  toast.success('Cards exported');
};
```

---

## Customization

### Changing Card Layout
```typescript
// For 3 cards per row instead of 2:
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// For 1 card per row (detail view):
<div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">

// For variable columns:
<div className="grid gap-4 auto-cols-max">
```

### Customizing QR Code Size
```typescript
const generateQRCodeUrl = (rabbitId: string, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  const sizes = {
    small: '100x100',
    medium: '150x150',
    large: '200x200',
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const rabbitUrl = `${baseUrl}/rabbits/${rabbitId}`;
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=${sizes[size]}&data=${encodeURIComponent(rabbitUrl)}`;
};
```

### Adding Custom Fields to Cards
```typescript
// Extend CageCardData interface
interface CageCardDataExtended extends CageCardData {
  parentDoeId?: string;
  parentBuckId?: string;
  ageInDays?: number;
  weight?: number;
  lastVaccine?: string;
}

// Use in generation
const newCard: CageCardDataExtended = {
  ...baseCard,
  parentDoeId: rabbit.parent_doe_id,
  parentBuckId: rabbit.parent_buck_id,
  ageInDays: calculateAge(rabbit.date_of_birth),
  weight: rabbit.weight,
};
```

### Changing Print Margins
```typescript
// Modify CSS
const printStyles = `
  @media print {
    @page {
      size: letter;
      margin: 0.5in; /* Changed from 0.25in */
    }
  }
`;
```

---

## API Integration

### Fetching with Error Handling
```typescript
const fetchRabbitsWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      setLoading(true);
      const response = await fetch('/api/rabbits?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format');
      }

      setRabbits(data.data);
      setFilteredRabbits(data.data);
      setError(null);
      break;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (attempt === maxRetries) {
        setError(errorMessage);
        toast.error(`Failed after ${maxRetries} retries: ${errorMessage}`);
      } else {
        toast.loading(`Retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } finally {
      if (attempt === maxRetries) {
        setLoading(false);
      }
    }
  }
};
```

### Pagination Support
```typescript
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [totalRabbits, setTotalRabbits] = useState(0);

const fetchRabbitsWithPagination = async () => {
  try {
    const response = await fetch(
      `/api/rabbits?page=${page}&limit=${pageSize}`,
      { method: 'GET' }
    );

    const data = await response.json();
    setRabbits(data.data || []);
    setTotalRabbits(data.total || 0);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Fetch failed');
  }
};

// Pagination controls
const totalPages = Math.ceil(totalRabbits / pageSize);
const canGoPrevious = page > 1;
const canGoNext = page < totalPages;
```

---

## Testing Examples

### Unit Test: QR Code Generation
```typescript
describe('generateQRCodeUrl', () => {
  it('should generate valid QR code URL', () => {
    const rabbitId = '123abc';
    const url = generateQRCodeUrl(rabbitId);
    
    expect(url).toContain('api.qrserver.com');
    expect(url).toContain('rabbits/123abc');
    expect(url).toContain('size=150x150');
  });

  it('should encode special characters', () => {
    const rabbitId = 'abc@123';
    const url = generateQRCodeUrl(rabbitId);
    
    expect(url).toContain(encodeURIComponent('rabbits/abc@123'));
  });
});
```

### Integration Test: Card Generation
```typescript
describe('handleGenerateCards', () => {
  it('should generate cards for selected rabbits', async () => {
    const mockRabbits = [
      {
        _id: '1',
        ear_tag_id: 'A1-001',
        name: 'Fluffy',
        // ... other fields
      }
    ];

    setRabbits(mockRabbits);
    setSelectedRabbits(['1']);

    handleGenerateCards();

    await waitFor(() => {
      expect(generatedCards).toHaveLength(1);
      expect(generatedCards[0].rabbitTag).toBe('A1-001');
    });
  });

  it('should show error if no rabbits selected', () => {
    setSelectedRabbits([]);

    handleGenerateCards();

    expect(toast.error).toHaveBeenCalledWith('Please select at least one rabbit');
  });
});
```

### E2E Test: Complete Workflow
```typescript
describe('Cage Cards E2E', () => {
  it('should generate and print cards', async () => {
    // 1. Load page
    render(<CageCardsPage />);

    // 2. Wait for rabbits to load
    await waitFor(() => {
      expect(screen.getByText(/Loading rabbits/i)).not.toBeInTheDocument();
    });

    // 3. Select a rabbit
    const checkbox = screen.getByRole('checkbox', { name: /A1-001/ });
    fireEvent.click(checkbox);

    // 4. Generate card
    const generateBtn = screen.getByRole('button', { name: /Generate/ });
    fireEvent.click(generateBtn);

    // 5. Verify card appears
    await waitFor(() => {
      expect(screen.getByText('Generated Cards (1)')).toBeInTheDocument();
    });

    // 6. Select for print
    const printCheckbox = screen.getByRole('checkbox', { name: /Select for printing/ });
    fireEvent.click(printCheckbox);

    // 7. Open print dialog
    const printBtn = screen.getByRole('button', { name: /Print 1 Card/ });
    fireEvent.click(printBtn);

    // 8. Verify dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

---

## Extending Features

### Adding Export Functionality
```typescript
// Add to imports
import html2pdf from 'html2pdf.js';

// Add to handlers
const exportCardsToPDF = () => {
  if (generatedCards.length === 0) {
    toast.error('No cards to export');
    return;
  }

  const element = document.querySelector('#print-area');
  if (!element) return;

  const opt = {
    margin: 10,
    filename: `cage-cards-${new Date().toISOString()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'letter' },
  };

  html2pdf().set(opt).from(element).save();
  toast.success('PDF exported');
};
```

### Adding Card Templates
```typescript
type CardTemplate = 'simple' | 'detailed' | 'minimal' | 'custom';

const getCardTemplate = (template: CardTemplate) => {
  const templates = {
    simple: {
      showPhotos: false,
      showBreedHistory: false,
      showCustomNotes: true,
      layout: 'compact',
    },
    detailed: {
      showPhotos: true,
      showBreedHistory: true,
      showCustomNotes: true,
      layout: 'standard',
    },
    minimal: {
      showPhotos: false,
      showBreedHistory: false,
      showCustomNotes: false,
      layout: 'compact',
    },
    custom: {
      showPhotos: true,
      showBreedHistory: true,
      showCustomNotes: true,
      layout: 'standard',
    },
  };

  return templates[template];
};
```

### Adding Persistence (Local Storage)
```typescript
// Save to localStorage
const saveCardsToLocalStorage = () => {
  try {
    const data = {
      generatedCards,
      customNotes,
      includePedigree,
      includeHealth,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('sunguraSmart_cageCards', JSON.stringify(data));
    toast.success('Cards saved locally');
  } catch (err) {
    toast.error('Failed to save cards');
  }
};

// Load from localStorage
const loadCardsFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('sunguraSmart_cageCards');
    if (stored) {
      const data = JSON.parse(stored);
      setGeneratedCards(data.generatedCards);
      setCustomNotes(data.customNotes);
      setIncludePedigree(data.includePedigree);
      setIncludeHealth(data.includeHealth);
      toast.success('Cards restored from storage');
    }
  } catch (err) {
    toast.error('Failed to load saved cards');
  }
};
```

### Adding Analytics Tracking
```typescript
import { usePostHog } from 'posthog-js/react';

export function CageCardsWithAnalytics() {
  const posthog = usePostHog();

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    posthog?.capture(eventName, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  };

  const handleGenerateCards = () => {
    // ... existing logic
    trackEvent('cage_cards_generated', {
      count: selectedRabbits.length,
      includePedigree,
      includeHealth,
    });
  };

  const handlePrint = () => {
    // ... existing logic
    trackEvent('cage_cards_printed', {
      cardCount: selectedCardsToPrint.length,
    });
  };
}
```

---

## Error Handling Best Practices

### Try-Catch Wrapper
```typescript
const safeAsync = async <T,>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : errorMessage;
    toast.error(message);
    console.error(message, err);
    return null;
  }
};

// Usage
const data = await safeAsync(
  () => fetch('/api/rabbits').then(r => r.json()),
  'Failed to fetch rabbits'
);
```

---

## Performance Optimization Tips

### Memoization
```typescript
import { useMemo, useCallback } from 'react';

// Memoize filter results
const filteredRabbits = useMemo(() => {
  return rabbits.filter(rabbit => {
    const matchesSearch = /* ... */;
    const matchesStatus = /* ... */;
    const matchesGender = /* ... */;
    return matchesSearch && matchesStatus && matchesGender;
  });
}, [rabbits, searchTerm, filterStatus, filterGender]);

// Memoize handler
const handleGenerateCards = useCallback(() => {
  // ... handler logic
}, [selectedRabbits, customNotes, includePedigree, includeHealth]);
```

### Virtual Lists (for 1000+ rabbits)
```typescript
import { FixedSizeList } from 'react-window';

const RabbitListVirtualized = ({ rabbits }: { rabbits: RabbitData[] }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      {/* Render rabbit at index */}
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={rabbits.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

**Last Updated**: December 30, 2024  
**Version**: 1.0.0
