'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, FileText, Pill, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { HealthRecordTableData } from '@/app/health/types';
import { HealthRecordForm, HealthRecordFormData, IRabbitOption, IDiseaseOption } from './HealthRecordForm';

interface HealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: HealthRecordFormData) => Promise<void> | void;
  record?: HealthRecordTableData | null;
  rabbits: IRabbitOption[];
  diseases: IDiseaseOption[];
  mode?: 'view' | 'edit'; // 'view' for details, 'edit' for form
  isLoading?: boolean;
}

export function HealthRecordModal({
  isOpen,
  onClose,
  onSubmit,
  record,
  rabbits,
  diseases,
  mode = 'view',
  isLoading = false,
}: HealthRecordModalProps) {
  const [editMode, setEditMode] = useState(mode === 'edit');

  useEffect(() => {
    setEditMode(mode === 'edit');
  }, [mode]);

  const handleFormSubmit = async (data: HealthRecordFormData) => {
    if (onSubmit) {
      await onSubmit(data);
      onClose();
    }
  };

  if (!record) return null;

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Quarantined':
        return 'destructive';
      case 'Sick':
        return 'destructive';
      case 'Treated':
        return 'secondary';
      case 'Resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {editMode ? 'Edit Health Record' : 'Health Record Details'}
          </DialogTitle>
          <DialogDescription>
            {editMode ? 'Update the health record information' : 'View full health record details for this rabbit'}
          </DialogDescription>
        </DialogHeader>

        {editMode && onSubmit ? (
          <HealthRecordForm
            rabbits={rabbits}
            diseases={diseases}
            onSubmit={handleFormSubmit}
            onCancel={onClose}
            initialData={{
              rabbit_id: record.rabbit_id,
              disease_id: record.disease_id,
              date_of_diagnosis: format(new Date(record.date_of_diagnosis), 'yyyy-MM-dd'),
              treatment_start_date: format(new Date(record.treatment_start_date), 'yyyy-MM-dd'),
              treatment_end_date: record.treatment_end_date ? format(new Date(record.treatment_end_date), 'yyyy-MM-dd') : '',
              quarantined: record.quarantined,
              notes: record.notes || '',
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Rabbit Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rabbit Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rabbit Tag ID</p>
                    <p className="font-medium">{record.rabbit_tag_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{record.rabbit_full_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disease Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pill className="h-4 w-4" />
                  Disease Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Disease Name</p>
                  <p className="font-medium">{record.disease_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(record.current_status)} className="capitalize">
                      {record.current_status === 'Quarantined' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {record.current_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date of Diagnosis</p>
                  <p className="font-medium">
                    {format(new Date(record.date_of_diagnosis), 'MMMM dd, yyyy')}
                    <span className="text-xs text-muted-foreground ml-2">({record.days_since_diagnosis} days ago)</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Treatment Period</p>
                  <p className="font-medium">
                    {format(new Date(record.treatment_start_date), 'MMM dd, yyyy')}
                    {record.treatment_end_date
                      ? ` - ${format(new Date(record.treatment_end_date), 'MMM dd, yyyy')}`
                      : ' - Ongoing'
                    }
                  </p>
                  {record.treatment_duration_days !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {record.treatment_duration_days} days
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quarantine Status */}
            {record.quarantined && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Quarantine Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-red-700">This rabbit is in quarantine</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {record.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!editMode && (
          <DialogFooter className="gap-2">
            {onSubmit && (
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                disabled={isLoading}
              >
                Edit
              </Button>
            )}
            <Button
              onClick={onClose}
              disabled={isLoading}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
