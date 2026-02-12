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

export interface IRabbitOption {
  _id: string;
  ear_tag_id: string;
  name: string | null;
  gender: string;
}

export interface BreedingFormData {
  doe_id: string;
  buck_id: string;
  mating_date: string; // ISO date string
  expected_kindling_date: string; // ISO date string
  is_successful: boolean;
}

interface BreedingFormProps {
  rabbits: IRabbitOption[];
  onSubmit: (data: BreedingFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<BreedingFormData>;
  isLoading?: boolean;
}

export function BreedingForm({
  rabbits,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: BreedingFormProps) {
  const [formData, setFormData] = useState<BreedingFormData>({
    doe_id: initialData?.doe_id || '',
    buck_id: initialData?.buck_id || '',
    mating_date: initialData?.mating_date || new Date().toISOString().split('T')[0],
    expected_kindling_date: initialData?.expected_kindling_date || '',
    is_successful: initialData?.is_successful || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter rabbits by gender for doe and buck
  const does = rabbits.filter((r) => r.gender === 'Female');
  const bucks = rabbits.filter((r) => r.gender === 'Male');

  // Auto-calculate expected kindling date (31 days after mating)
  const handleMatingDateChange = (date: string) => {
    setFormData((prev) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 31);
      return {
        ...prev,
        mating_date: date,
        expected_kindling_date: newDate.toISOString().split('T')[0],
      };
    });
    if (errors.mating_date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.mating_date;
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doe_id) {
      newErrors.doe_id = 'Please select a doe';
    }
    if (!formData.buck_id) {
      newErrors.buck_id = 'Please select a buck';
    }
    if (!formData.mating_date) {
      newErrors.mating_date = 'Mating date is required';
    }
    if (formData.doe_id === formData.buck_id) {
      newErrors.buck_id = 'Doe and buck must be different rabbits';
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

  const handleChange = (field: keyof BreedingFormData, value: string | boolean) => {
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
        <CardTitle>{initialData?.doe_id ? 'Edit Breeding' : 'Record New Breeding'}</CardTitle>
        <CardDescription>
          {initialData?.doe_id
            ? 'Update the breeding details below'
            : 'Record a new breeding event between a doe and buck'}
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

          {/* Doe and Buck Selection */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doe_id">Doe (Female) *</Label>
              <Select
                value={formData.doe_id}
                onValueChange={(value) => handleChange('doe_id', value)}
                disabled={isFormSubmitting}
              >
                <SelectTrigger
                  id="doe_id"
                  aria-invalid={!!errors.doe_id}
                  aria-describedby={errors.doe_id ? 'doe_id-error' : undefined}
                >
                  <SelectValue placeholder="Select a doe" />
                </SelectTrigger>
                <SelectContent>
                  {does.map((doe) => (
                    <SelectItem key={doe._id} value={doe._id}>
                      {doe.name ? `${doe.ear_tag_id} - ${doe.name}` : doe.ear_tag_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doe_id && (
                <p id="doe_id-error" className="text-sm text-red-600">
                  {errors.doe_id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buck_id">Buck (Male) *</Label>
              <Select
                value={formData.buck_id}
                onValueChange={(value) => handleChange('buck_id', value)}
                disabled={isFormSubmitting}
              >
                <SelectTrigger
                  id="buck_id"
                  aria-invalid={!!errors.buck_id}
                  aria-describedby={errors.buck_id ? 'buck_id-error' : undefined}
                >
                  <SelectValue placeholder="Select a buck" />
                </SelectTrigger>
                <SelectContent>
                  {bucks.map((buck) => (
                    <SelectItem key={buck._id} value={buck._id}>
                      {buck.name ? `${buck.ear_tag_id} - ${buck.name}` : buck.ear_tag_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buck_id && (
                <p id="buck_id-error" className="text-sm text-red-600">
                  {errors.buck_id}
                </p>
              )}
            </div>
          </div>

          {/* Mating and Expected Kindling Dates */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mating_date">Mating Date *</Label>
              <Input
                id="mating_date"
                type="date"
                value={formData.mating_date}
                onChange={(e) => handleMatingDateChange(e.target.value)}
                disabled={isFormSubmitting}
                aria-invalid={!!errors.mating_date}
                aria-describedby={errors.mating_date ? 'mating_date-error' : undefined}
              />
              {errors.mating_date && (
                <p id="mating_date-error" className="text-sm text-red-600">
                  {errors.mating_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_kindling_date">Expected Kindling Date</Label>
              <Input
                id="expected_kindling_date"
                type="date"
                value={formData.expected_kindling_date}
                onChange={(e) => handleChange('expected_kindling_date', e.target.value)}
                disabled={isFormSubmitting}
                className="bg-muted"
                title="Automatically calculated as 31 days after mating date"
              />
              <p className="text-xs text-muted-foreground">Auto-calculated (31 days after mating)</p>
            </div>
          </div>

          {/* Success checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="is_successful"
              type="checkbox"
              checked={formData.is_successful}
              onChange={(e) => handleChange('is_successful', e.target.checked)}
              disabled={isFormSubmitting}
              className="h-4 w-4 rounded border border-gray-300 cursor-pointer"
            />
            <Label htmlFor="is_successful" className="font-normal cursor-pointer">
              Mark as Successful (Kindling Confirmed)
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isFormSubmitting} className="flex-1">
              {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFormSubmitting ? 'Saving...' : 'Save Breeding'}
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
