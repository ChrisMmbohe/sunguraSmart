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
import { AlertCircle, Loader2, Pill, Activity } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export interface IRabbitOption {
  _id: string;
  ear_tag_id: string;
  name: string | null;
  gender: 'Male' | 'Female';
}

export interface IDiseaseOption {
  _id: string;
  name: string;
  is_quarantinable: boolean;
}

export interface HealthRecordFormData {
  rabbit_id: string;
  disease_id: string;
  date_of_diagnosis: string; // ISO date string
  treatment_start_date: string; // ISO date string
  treatment_end_date: string; // ISO date string (can be empty for ongoing)
  quarantined: boolean;
  notes: string;
}

interface HealthRecordFormProps {
  rabbits: IRabbitOption[];
  diseases: IDiseaseOption[];
  onSubmit: (data: HealthRecordFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<HealthRecordFormData>;
  isLoading?: boolean;
}

export function HealthRecordForm({
  rabbits,
  diseases,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: HealthRecordFormProps) {
  const [formData, setFormData] = useState<HealthRecordFormData>({
    rabbit_id: initialData?.rabbit_id || '',
    disease_id: initialData?.disease_id || '',
    date_of_diagnosis: initialData?.date_of_diagnosis || new Date().toISOString().split('T')[0],
    treatment_start_date: initialData?.treatment_start_date || new Date().toISOString().split('T')[0],
    treatment_end_date: initialData?.treatment_end_date || '',
    quarantined: initialData?.quarantined || false,
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Get selected disease to auto-set quarantine if needed
  const selectedDisease = diseases.find(d => d._id === formData.disease_id);
  const shouldForceQuarantine = selectedDisease?.is_quarantinable || false;

  // Validation logic
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.rabbit_id.trim()) {
      newErrors.rabbit_id = 'Rabbit is required';
    }
    if (!formData.disease_id.trim()) {
      newErrors.disease_id = 'Disease is required';
    }
    if (!formData.date_of_diagnosis) {
      newErrors.date_of_diagnosis = 'Diagnosis date is required';
    }
    if (!formData.treatment_start_date) {
      newErrors.treatment_start_date = 'Treatment start date is required';
    }

    // Validate dates
    const diagnosisDate = new Date(formData.date_of_diagnosis);
    const treatmentStartDate = new Date(formData.treatment_start_date);
    if (treatmentStartDate < diagnosisDate) {
      newErrors.treatment_start_date = 'Treatment start date cannot be before diagnosis date';
    }

    if (formData.treatment_end_date) {
      const treatmentEndDate = new Date(formData.treatment_end_date);
      if (treatmentEndDate < treatmentStartDate) {
        newErrors.treatment_end_date = 'Treatment end date cannot be before start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof HealthRecordFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getRabbitDisplayName = (rabbit: IRabbitOption): string => {
    return rabbit.name ? `${rabbit.ear_tag_id} - ${rabbit.name}` : rabbit.ear_tag_id;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Health Record
        </CardTitle>
        <CardDescription>
          Record a new diagnosis, treatment, or health event for a rabbit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rabbit Selection */}
          <div className="space-y-2">
            <Label htmlFor="rabbit">Rabbit *</Label>
            <Select
              value={formData.rabbit_id}
              onValueChange={(value) => handleInputChange('rabbit_id', value)}
              disabled={isLoading || submitting}
            >
              <SelectTrigger id="rabbit" className={errors.rabbit_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a rabbit" />
              </SelectTrigger>
              <SelectContent>
                {rabbits.map((rabbit) => (
                  <SelectItem key={rabbit._id} value={rabbit._id}>
                    {getRabbitDisplayName(rabbit)}
                    {rabbit.gender === 'Female' && <span className="text-pink-500 ml-1">♀</span>}
                    {rabbit.gender === 'Male' && <span className="text-blue-500 ml-1">♂</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rabbit_id && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.rabbit_id}
              </p>
            )}
          </div>

          {/* Disease Selection */}
          <div className="space-y-2">
            <Label htmlFor="disease">Disease *</Label>
            <Select
              value={formData.disease_id}
              onValueChange={(value) => handleInputChange('disease_id', value)}
              disabled={isLoading || submitting}
            >
              <SelectTrigger id="disease" className={errors.disease_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a disease" />
              </SelectTrigger>
              <SelectContent>
                {diseases.map((disease) => (
                  <SelectItem key={disease._id} value={disease._id}>
                    {disease.name}
                    {disease.is_quarantinable && <span className="ml-2 text-xs text-red-600">(Quarantinable)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.disease_id && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.disease_id}
              </p>
            )}
          </div>

          {/* Diagnosis Date */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis_date">Diagnosis Date *</Label>
            <Input
              id="diagnosis_date"
              type="date"
              value={formData.date_of_diagnosis}
              onChange={(e) => handleInputChange('date_of_diagnosis', e.target.value)}
              disabled={isLoading || submitting}
              className={errors.date_of_diagnosis ? 'border-red-500' : ''}
            />
            {errors.date_of_diagnosis && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.date_of_diagnosis}
              </p>
            )}
          </div>

          {/* Treatment Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treatment_start">Treatment Start Date *</Label>
              <Input
                id="treatment_start"
                type="date"
                value={formData.treatment_start_date}
                onChange={(e) => handleInputChange('treatment_start_date', e.target.value)}
                disabled={isLoading || submitting}
                className={errors.treatment_start_date ? 'border-red-500' : ''}
              />
              {errors.treatment_start_date && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.treatment_start_date}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment_end">Treatment End Date (Optional)</Label>
              <Input
                id="treatment_end"
                type="date"
                value={formData.treatment_end_date}
                onChange={(e) => handleInputChange('treatment_end_date', e.target.value)}
                disabled={isLoading || submitting}
                className={errors.treatment_end_date ? 'border-red-500' : ''}
              />
              {errors.treatment_end_date && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.treatment_end_date}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Leave blank for ongoing treatment
              </p>
            </div>
          </div>

          {/* Quarantine Checkbox */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="quarantined"
                checked={formData.quarantined || shouldForceQuarantine}
                onCheckedChange={(checked) => handleInputChange('quarantined', checked)}
                disabled={isLoading || submitting || shouldForceQuarantine}
              />
              <Label htmlFor="quarantined" className="flex items-center gap-2 cursor-pointer">
                <Activity className="h-4 w-4" />
                Mark as Quarantined
              </Label>
            </div>
            {shouldForceQuarantine && (
              <p className="text-xs text-amber-600">
                ⚠️ This disease is quarantinable and will automatically set quarantine status
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={isLoading || submitting}
              placeholder="Treatment details, symptoms observed, medication used, etc."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || submitting}
              className="flex-1"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Saving...' : 'Save Health Record'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || submitting}
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
