'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export interface IBreedingOption {
  _id: string;
  doe_name: string;
  buck_name: string;
  mating_date: Date;
}

export interface LitterFormData {
  breeding_id: string;
  kindling_date: string; // ISO date string
  total_kits_born: number;
  kits_surviving: number;
  weaning_date: string; // ISO date string, optional
  status: 'Active' | 'Weaned' | 'Closed';
}

interface LitterFormProps {
  breedings: IBreedingOption[];
  onSubmit: (data: LitterFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<LitterFormData>;
  isLoading?: boolean;
}

const LITTER_STATUSES: Array<'Active' | 'Weaned' | 'Closed'> = ['Active', 'Weaned', 'Closed'];

export function LitterForm({
  breedings,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: LitterFormProps) {
  const [formData, setFormData] = useState<LitterFormData>({
    breeding_id: initialData?.breeding_id || '',
    kindling_date: initialData?.kindling_date || new Date().toISOString().split('T')[0],
    total_kits_born: initialData?.total_kits_born || 0,
    kits_surviving: initialData?.kits_surviving || 0,
    weaning_date: initialData?.weaning_date || '',
    status: initialData?.status || 'Active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.breeding_id) {
      newErrors.breeding_id = 'Please select a breeding event';
    }
    if (!formData.kindling_date) {
      newErrors.kindling_date = 'Kindling date is required';
    }
    if (formData.total_kits_born < 0) {
      newErrors.total_kits_born = 'Total kits born must be 0 or more';
    }
    if (formData.kits_surviving < 0) {
      newErrors.kits_surviving = 'Surviving kits must be 0 or more';
    }
    if (formData.kits_surviving > formData.total_kits_born) {
      newErrors.kits_surviving = 'Surviving kits cannot exceed total born';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof LitterFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isFormSubmitting = submitting || isLoading;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData?.breeding_id ? 'Edit Litter' : 'Record New Litter'}</CardTitle>
        <CardDescription>
          {initialData?.breeding_id
            ? 'Update the litter details below'
            : 'Record a new litter from a breeding event'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {errors.submit && (
            <div className="flex gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Breeding Selection */}
          <div className="space-y-2">
            <Label htmlFor="breeding_id">Breeding Event *</Label>
            <Select
              value={formData.breeding_id}
              onValueChange={(value) => handleChange('breeding_id', value)}
              disabled={isFormSubmitting}
            >
              <SelectTrigger
                id="breeding_id"
                aria-invalid={!!errors.breeding_id}
                aria-describedby={errors.breeding_id ? 'breeding_id-error' : undefined}
              >
                <SelectValue placeholder="Select a breeding event" />
              </SelectTrigger>
              <SelectContent>
                {breedings.map((breeding) => (
                  <SelectItem key={breeding._id} value={breeding._id}>
                    {breeding.doe_name} × {breeding.buck_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.breeding_id && (
              <p id="breeding_id-error" className="text-sm text-red-600">
                {errors.breeding_id}
              </p>
            )}
          </div>

          {/* Kindling Date and Status */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kindling_date">Kindling Date *</Label>
              <Input
                id="kindling_date"
                type="date"
                value={formData.kindling_date}
                onChange={(e) => handleChange('kindling_date', e.target.value)}
                disabled={isFormSubmitting}
                aria-invalid={!!errors.kindling_date}
                aria-describedby={errors.kindling_date ? 'kindling_date-error' : undefined}
              />
              {errors.kindling_date && (
                <p id="kindling_date-error" className="text-sm text-red-600">
                  {errors.kindling_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value as 'Active' | 'Weaned' | 'Closed')}
                disabled={isFormSubmitting}
              >
                <SelectTrigger
                  id="status"
                  aria-invalid={!!errors.status}
                  aria-describedby={errors.status ? 'status-error' : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LITTER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p id="status-error" className="text-sm text-red-600">
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          {/* Kit Counts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_kits_born">Total Kits Born *</Label>
              <Input
                id="total_kits_born"
                type="number"
                min="0"
                value={formData.total_kits_born}
                onChange={(e) => handleChange('total_kits_born', parseInt(e.target.value) || 0)}
                disabled={isFormSubmitting}
                aria-invalid={!!errors.total_kits_born}
                aria-describedby={errors.total_kits_born ? 'total_kits_born-error' : undefined}
              />
              {errors.total_kits_born && (
                <p id="total_kits_born-error" className="text-sm text-red-600">
                  {errors.total_kits_born}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kits_surviving">Kits Surviving *</Label>
              <Input
                id="kits_surviving"
                type="number"
                min="0"
                value={formData.kits_surviving}
                onChange={(e) => handleChange('kits_surviving', parseInt(e.target.value) || 0)}
                disabled={isFormSubmitting}
                aria-invalid={!!errors.kits_surviving}
                aria-describedby={errors.kits_surviving ? 'kits_surviving-error' : undefined}
              />
              {errors.kits_surviving && (
                <p id="kits_surviving-error" className="text-sm text-red-600">
                  {errors.kits_surviving}
                </p>
              )}
            </div>
          </div>

          {/* Weaning Date */}
          <div className="space-y-2">
            <Label htmlFor="weaning_date">Weaning Date (Optional)</Label>
            <Input
              id="weaning_date"
              type="date"
              value={formData.weaning_date}
              onChange={(e) => handleChange('weaning_date', e.target.value)}
              disabled={isFormSubmitting}
            />
            <p className="text-xs text-muted-foreground">Leave blank if weaning hasn&apos;t occurred yet</p>
          </div>

          {/* Survival Rate Display */}
          {formData.total_kits_born > 0 && (
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Survival Rate:</span> {((formData.kits_surviving / formData.total_kits_born) * 100).toFixed(0)}%
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isFormSubmitting} className="flex-1">
              {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFormSubmitting ? 'Saving...' : 'Save Litter'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isFormSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
