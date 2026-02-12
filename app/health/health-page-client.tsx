'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, X, ChevronDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HealthRecordTableData } from './types';
import { HealthRecordModal } from '@/components/HealthRecordModal';
import { IRabbitOption, HealthRecordFormData, IDiseaseOption } from '@/components/HealthRecordForm';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';
import { toast } from 'sonner';

interface HealthPageClientProps {
  initialRecords: HealthRecordTableData[];
  rabbits: IRabbitOption[];
  diseases: IDiseaseOption[];
  columns: ColumnDef<HealthRecordTableData>[];
}

export function HealthPageClient({
  initialRecords,
  rabbits,
  diseases,
  columns,
}: HealthPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecordTableData | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [records, setRecords] = useState<HealthRecordTableData[]>(initialRecords);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Filter records based on multi-field search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();
    return records.filter((record) => {
      // Search across multiple fields
      const rabbitTag = (record.rabbit_tag_id || '').toLowerCase();
      const diseaseName = (record.disease_name || '').toLowerCase();
      const status = (record.current_status || '').toLowerCase();
      const notes = (record.notes || '').toLowerCase();
      const quarantineStatus = record.quarantined ? 'quarantined' : '';
      
      return (
        rabbitTag.includes(query) ||
        diseaseName.includes(query) ||
        status.includes(query) ||
        notes.includes(query) ||
        quarantineStatus.includes(query)
      );
    });
  }, [records, searchQuery]);

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleRowClick = (row: Row<HealthRecordTableData>) => {
    setSelectedRecord(row.original);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleFormSubmit = async (formData: HealthRecordFormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = selectedRecord?._id;
      const method = isEditing ? 'PUT' : 'POST';
      const url = '/api/health';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing ? { ...formData, id: selectedRecord._id } : formData
        ),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save health record');
      }

      const result = await response.json();

      // Update local state with new/updated record
      if (isEditing && selectedRecord) {
        // Convert form data dates back to Date objects for display
        const diagnosisDate = new Date(formData.date_of_diagnosis);
        const treatmentStartDate = new Date(formData.treatment_start_date);
        const treatmentEndDate = formData.treatment_end_date 
          ? new Date(formData.treatment_end_date)
          : null;
        const today = new Date();
        
        // Auto-clear quarantine when treatment is complete (disease resolved)
        const shouldClearQuarantine = treatmentEndDate !== null;
        const quarantineStatus = shouldClearQuarantine ? false : formData.quarantined;
        
        // Calculate derived fields dynamically
        const isActive = treatmentEndDate === null;
        const daysSinceDiagnosis = Math.floor((today.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24));
        const treatmentDurationDays = treatmentEndDate
          ? Math.floor((treatmentEndDate.getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Recalculate current status based on new values
        let currentStatus: 'Sick' | 'Quarantined' | 'Treated' | 'Resolved';
        if (isActive) {
          currentStatus = quarantineStatus ? 'Quarantined' : 'Sick';
        } else {
          currentStatus = treatmentEndDate && treatmentEndDate < today ? 'Resolved' : 'Treated';
        }

        const updatedRecord: HealthRecordTableData = {
          ...selectedRecord,
          date_of_diagnosis: diagnosisDate,
          treatment_start_date: treatmentStartDate,
          treatment_end_date: treatmentEndDate,
          quarantined: quarantineStatus,
          notes: formData.notes || null,
          is_active: isActive,
          current_status: currentStatus,
          days_since_diagnosis: daysSinceDiagnosis,
          treatment_duration_days: treatmentDurationDays,
        };
        setRecords(records.map(r => r._id === selectedRecord._id ? updatedRecord : r));
        toast.success('Health record updated successfully');
      } else {
        // For new records, we'll need to reconstruct the table data from the API response
        // The API should return the full record with populated fields
        setRecords([...records, result.data as HealthRecordTableData]);
        toast.success('Health record created successfully');
      }

      handleModalClose();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save health record'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar, Column Toggle & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by rabbit tag, disease, status, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Settings2 className="mr-2 h-4 w-4" />
              Columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns
              .filter((column) => {
                const colDef = column as any;
                return (typeof colDef.accessorFn !== 'undefined' || colDef.accessorKey);
              })
              .map((column) => {
                const colDef = column as any;
                const columnId = colDef.id || (typeof colDef.accessorKey === 'string' ? colDef.accessorKey : '');
                return (
                  <DropdownMenuCheckboxItem
                    key={columnId}
                    className="capitalize"
                    checked={columnVisibility[columnId] !== false}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({ ...prev, [columnId]: value }))
                    }
                  >
                    {columnId}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={handleAddRecord} disabled={isSubmitting} className="gap-2">
          <Plus className="h-4 w-4" />
          New Health Record
        </Button>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <p className="text-sm text-blue-900">
            Found <span className="font-semibold">{filteredRecords.length}</span> of{' '}
            <span className="font-semibold">{records.length}</span> health records
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="h-6 text-blue-600 hover:bg-blue-100"
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        onRowClick={handleRowClick}
        showColumnToggle={false}
      />

      {/* Modal */}
      <HealthRecordModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        record={selectedRecord}
        rabbits={rabbits}
        diseases={diseases}
        mode={modalMode}
        isLoading={isSubmitting}
      />
    </div>
  );
}
