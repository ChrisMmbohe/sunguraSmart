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
import { LitterForm, LitterFormData, IBreedingOption } from './LitterForm';
import { LitterTableData } from '@/app/litters/types';
import { format } from 'date-fns';
import { Baby, Calendar } from 'lucide-react';

interface LitterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (data: LitterFormData) => Promise<void> | void;
  litter?: LitterTableData | null;
  breedings: IBreedingOption[];
  isLoading?: boolean;
}

export function LitterDetailsModal({
  isOpen,
  onClose,
  onEdit,
  litter,
  breedings,
  isLoading = false,
}: LitterDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);

  // Reset edit mode when modal opens
  const resetEditMode = () => {
    setEditMode(false);
  };

  const handleFormSubmit = async (data: LitterFormData) => {
    if (onEdit) {
      await onEdit(data);
      onClose();
    }
  };

  if (!litter) return null;

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
            <Baby className="h-5 w-5" />
            {editMode ? 'Edit Litter' : 'Litter Details'}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Update the litter information'
              : `View full details for litter from ${litter.doe_name}`}
          </DialogDescription>
        </DialogHeader>

        {editMode && onEdit ? (
          <LitterForm
            breedings={breedings}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditMode(false)}
            initialData={{
              breeding_id: litter.breeding_id,
              kindling_date: format(new Date(litter.kindling_date), 'yyyy-MM-dd'),
              total_kits_born: litter.total_kits_born,
              kits_surviving: litter.kits_surviving,
              weaning_date: litter.weaning_date ? format(new Date(litter.weaning_date), 'yyyy-MM-dd') : '',
              status: litter.status,
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Parents Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Baby className="h-4 w-4" />
                  Parents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Doe</p>
                    <p className="font-medium text-pink-600">{litter.doe_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buck</p>
                    <p className="font-medium text-blue-600">{litter.buck_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kits Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Kits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Born</p>
                    <p className="text-2xl font-bold">{litter.total_kits_born}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Surviving</p>
                    <p className="text-2xl font-bold">{litter.kits_surviving}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-2xl font-bold">{litter.current_kits_count}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Survival Rate</p>
                  <p className="font-medium">{litter.survival_rate.toFixed(1)}%</p>
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
                  <p className="text-xs text-muted-foreground">Kindling Date</p>
                  <p className="font-medium">
                    {format(new Date(litter.kindling_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="font-medium">{litter.days_old} days old</p>
                </div>
                {litter.weaning_date && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weaning Date</p>
                    <p className="font-medium">
                      {format(new Date(litter.weaning_date), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
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
                    litter.status === 'Active'
                      ? 'default'
                      : litter.status === 'Weaned'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="capitalize"
                >
                  {litter.status}
                </Badge>
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
