'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { HealthRecordTableData } from './types';
import { HealthRecordModal } from '@/components/HealthRecordModal';
import { IRabbitOption } from '@/components/HealthRecordForm';
import { IDiseaseOption } from '@/components/HealthRecordForm';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';

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

  const handleFormSubmit = async (data: HealthRecordFormData) => {
    // This will be implemented when backend is ready
    console.log('Form submitted:', data);
    handleModalClose();
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleAddRecord} className="gap-2">
          <Plus className="h-4 w-4" />
          New Health Record
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={initialRecords}
        onRowClick={handleRowClick}
        searchKey="rabbit_tag_id"
        searchPlaceholder="Search rabbits..."
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
      />
    </div>
  );
}

interface HealthRecordFormData {
  rabbit_id: string;
  disease_id: string;
  date_of_diagnosis: string;
  treatment_start_date: string;
  treatment_end_date: string;
  quarantined: boolean;
  notes: string;
}
