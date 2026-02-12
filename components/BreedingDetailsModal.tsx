'use client';

import { useState } from 'react';
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
import { BreedingForm, BreedingFormData, IRabbitOption } from './BreedingForm';
import { BreedingTableData } from '@/app/breeding/types';
import { format } from 'date-fns';
import { Calendar, Heart } from 'lucide-react';

interface BreedingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (data: BreedingFormData) => Promise<void> | void;
  breeding?: BreedingTableData | null;
  rabbits: IRabbitOption[];
  isLoading?: boolean;
}

export function BreedingDetailsModal({
  isOpen,
  onClose,
  onEdit,
  breeding,
  rabbits,
  isLoading = false,
}: BreedingDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);

  // Reset edit mode when modal opens
  const resetEditMode = () => {
    setEditMode(false);
  };

  const handleFormSubmit = async (data: BreedingFormData) => {
    if (onEdit) {
      await onEdit(data);
      onClose();
    }
  };

  if (!breeding) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetEditMode();
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            {editMode ? 'Edit Breeding' : 'Breeding Details'}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Update the breeding information'
              : `View full details for ${breeding.doe_name} × ${breeding.buck_name}`}
          </DialogDescription>
        </DialogHeader>

        {editMode && onEdit ? (
          <BreedingForm
            rabbits={rabbits}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditMode(false)}
            initialData={{
              doe_id: breeding._id,
              buck_id: breeding._id,
              mating_date: format(new Date(breeding.mating_date), 'yyyy-MM-dd'),
              expected_kindling_date: format(new Date(breeding.expected_kindling_date), 'yyyy-MM-dd'),
              is_successful: breeding.is_successful,
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Parents Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4" />
                  Parents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Doe</p>
                    <p className="font-medium text-pink-600">{breeding.doe_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buck</p>
                    <p className="font-medium text-blue-600">{breeding.buck_name}</p>
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
                  <p className="text-xs text-muted-foreground">Mating Date</p>
                  <p className="font-medium">
                    {format(new Date(breeding.mating_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected Kindling Date</p>
                  <p className="font-medium">
                    {format(new Date(breeding.expected_kindling_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days Since Mating</p>
                  <p className="font-medium">{breeding.days_since_mating} days</p>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    breeding.status === 'Successful'
                      ? 'default'
                      : breeding.status === 'Pending'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="capitalize"
                >
                  {breeding.status}
                </Badge>
                {breeding.is_successful && breeding.litter_id && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Litter ID: {breeding.litter_id}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!editMode && (
          <DialogFooter className="gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                disabled={isLoading}
              >
                Edit
              </Button>
            )}
            <Button onClick={onClose} disabled={isLoading}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
