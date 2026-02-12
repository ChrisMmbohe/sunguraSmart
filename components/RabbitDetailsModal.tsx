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
import { formatDistanceStrict, format } from 'date-fns';
import { RabbitTableData } from '@/app/rabbits/types';
import { RabbitForm, RabbitFormData } from './RabbitForm';
import {
  AlertTriangle,
  Calendar,
  Heart,
  Home,
  Tag,
  Rabbit as RabbitIcon,
} from 'lucide-react';

interface RabbitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (data: RabbitFormData) => Promise<void> | void;
  rabbit?: RabbitTableData | null;
  breeds: Array<{ _id: string; name: string }>;
  cages: Array<{ _id: string; name: string; cage_type: string }>;
  earTagOptions: Array<{ id: string; label: string }>;
  isLoading?: boolean;
}

export function RabbitDetailsModal({
  isOpen,
  onClose,
  onEdit,
  rabbit,
  breeds,
  cages,
  earTagOptions,
  isLoading = false,
}: RabbitDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);

  // Reset edit mode when modal opens
  const resetEditMode = () => {
    setEditMode(false);
  };

  const handleFormSubmit = async (data: RabbitFormData) => {
    if (onEdit) {
      await onEdit(data);
      onClose();
    }
  };

  if (!rabbit) return null;

  const getStatusColor = (
    status: string
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Sold':
        return 'secondary';
      case 'Deceased':
      case 'Culled':
        return 'destructive';
      case 'Sick':
      case 'Quarantined':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
            <RabbitIcon className="h-5 w-5" />
            {editMode ? 'Edit Rabbit' : 'Rabbit Details'}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Update the rabbit information'
              : `View full details for ${rabbit.full_name || rabbit.tag_id}`}
          </DialogDescription>
        </DialogHeader>

        {editMode && onEdit ? (
          <RabbitForm
            breeds={breeds}
            cages={cages}
            earTagOptions={earTagOptions}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditMode(false)}
            initialData={{
              ear_tag_id: rabbit.tag_id,
              name: rabbit.full_name !== rabbit.tag_id ? rabbit.full_name : '',
              gender: rabbit.gender,
              date_of_birth: format(
                new Date(Date.now() - rabbit.age_in_days * 86400000),
                'yyyy-MM-dd'
              ),
              breed_id: '',
              current_cage_id: '',
              status: rabbit.status,
              source_type: 'Born',
              source_farm: '',
              is_pregnant: rabbit.is_pregnant,
              photo_url: '',
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Identification */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" />
                  Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Ear Tag ID</p>
                    <p className="font-medium">{rabbit.tag_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {rabbit.full_name !== rabbit.tag_id
                        ? rabbit.full_name
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Characteristics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RabbitIcon className="h-4 w-4" />
                  Physical Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium flex items-center gap-1">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          rabbit.gender === 'Male'
                            ? 'bg-blue-500'
                            : 'bg-pink-500'
                        }`}
                      ></span>
                      {rabbit.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Breed</p>
                    <p className="font-medium">{rabbit.breed_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age & Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Age & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="font-medium">
                    {formatDistanceStrict(
                      new Date(Date.now() - rabbit.age_in_days * 86400000),
                      new Date()
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rabbit.age_in_days} days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maturity</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {rabbit.maturity_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <Badge
                    variant={getStatusColor(rabbit.status)}
                    className="mt-1 capitalize"
                  >
                    {rabbit.status === 'Quarantined' && (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {rabbit.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Housing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-4 w-4" />
                  Housing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-xs text-muted-foreground">Current Cage</p>
                  <p className="font-medium">{rabbit.cage_id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Breeding Status */}
            {rabbit.gender === 'Female' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" />
                    Breeding Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={rabbit.is_pregnant ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {rabbit.is_pregnant ? 'Currently Pregnant' : 'Not Pregnant'}
                  </Badge>
                </CardContent>
              </Card>
            )}
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
