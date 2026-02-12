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

export interface IBreedOption {
  _id: string;
  name: string;
}

export interface ICageOption {
  _id: string;
  name: string;
  cage_type: string;
}

export interface RabbitFormData {
  ear_tag_id: string;
  name: string;
  gender: 'Male' | 'Female';
  date_of_birth: string; // ISO date string
  breed_id: string;
  current_cage_id: string;
  status: string;
  source_type: 'Born' | 'Purchased' | 'Gifted';
  source_farm: string;
  is_pregnant: boolean;
  photo_url: string;
}

interface IEarTagOption {
  id: string;
  label: string;
}

interface RabbitFormProps {
  breeds: IBreedOption[];
  cages: ICageOption[];
  earTagOptions?: IEarTagOption[];
  onSubmit: (data: RabbitFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<RabbitFormData>;
  isLoading?: boolean;
}

const RABBIT_STATUSES = ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'];
const SOURCE_TYPES: Array<'Born' | 'Purchased' | 'Gifted'> = ['Born', 'Purchased', 'Gifted'];

export function RabbitForm({
  breeds,
  cages,
  earTagOptions = [],
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: RabbitFormProps) {
  const [formData, setFormData] = useState<RabbitFormData>({
    ear_tag_id: initialData?.ear_tag_id || '',
    name: initialData?.name || '',
    gender: initialData?.gender || 'Male',
    date_of_birth: initialData?.date_of_birth || new Date().toISOString().split('T')[0],
    breed_id: initialData?.breed_id || '',
    current_cage_id: initialData?.current_cage_id || '',
    status: initialData?.status || 'Kit',
    source_type: initialData?.source_type || 'Born',
    source_farm: initialData?.source_farm || '',
    is_pregnant: initialData?.is_pregnant || false,
    photo_url: initialData?.photo_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validation logic
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ear_tag_id.trim()) {
      newErrors.ear_tag_id = 'Ear tag ID is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    if (!formData.breed_id) {
      newErrors.breed_id = 'Breed is required';
    }
    if (!formData.current_cage_id) {
      newErrors.current_cage_id = 'Cage is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    if (!formData.source_type) {
      newErrors.source_type = 'Source type is required';
    }
    // Validate source_farm is required for Purchased or Gifted
    if (['Purchased', 'Gifted'].includes(formData.source_type)) {
      if (!formData.source_farm.trim()) {
        newErrors.source_farm = 'Source farm/seller is required for Purchased or Gifted rabbits';
      }
    }
    // Validate photo URL format if provided
    if (formData.photo_url.trim()) {
      try {
        new URL(formData.photo_url);
      } catch {
        newErrors.photo_url = 'Please enter a valid URL';
      }
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

  const handleChange = (field: keyof RabbitFormData, value: string | boolean | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
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
        <CardTitle>{initialData?.ear_tag_id ? 'Edit Rabbit' : 'Add New Rabbit'}</CardTitle>
        <CardDescription>
          {initialData?.ear_tag_id ? 'Update the rabbit details below' : 'Fill in the details to create a new rabbit record'}
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

          {/* Ear Tag ID and Name */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ear_tag_id">Ear Tag ID *</Label>
              {earTagOptions.length > 0 ? (
                <Select value={formData.ear_tag_id} onValueChange={(value) => handleChange('ear_tag_id', value)} disabled={isFormSubmitting}>
                  <SelectTrigger id="ear_tag_id" aria-invalid={!!errors.ear_tag_id} aria-describedby={errors.ear_tag_id ? 'ear_tag_id-error' : undefined}>
                    <SelectValue placeholder="Select an available ear tag ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {earTagOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="ear_tag_id"
                  placeholder="e.g., A1-001"
                  value={formData.ear_tag_id}
                  onChange={(e) => handleChange('ear_tag_id', e.target.value)}
                  disabled={isFormSubmitting}
                  aria-invalid={!!errors.ear_tag_id}
                  aria-describedby={errors.ear_tag_id ? 'ear_tag_id-error' : undefined}
                />
              )}
              {errors.ear_tag_id && (
                <p id="ear_tag_id-error" className="text-sm text-red-600">
                  {errors.ear_tag_id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                placeholder="e.g., Bunny"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isFormSubmitting}
              />
            </div>
          </div>

          {/* Gender and Date of Birth */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)} disabled={isFormSubmitting}>
                <SelectTrigger id="gender" aria-invalid={!!errors.gender} aria-describedby={errors.gender ? 'gender-error' : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p id="gender-error" className="text-sm text-red-600">
                  {errors.gender}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                disabled={isFormSubmitting}
                aria-invalid={!!errors.date_of_birth}
                aria-describedby={errors.date_of_birth ? 'date_of_birth-error' : undefined}
              />
              {errors.date_of_birth && (
                <p id="date_of_birth-error" className="text-sm text-red-600">
                  {errors.date_of_birth}
                </p>
              )}
            </div>
          </div>

          {/* Breed and Cage */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="breed_id">Breed *</Label>
              <Select value={formData.breed_id} onValueChange={(value) => handleChange('breed_id', value)} disabled={isFormSubmitting}>
                <SelectTrigger id="breed_id" aria-invalid={!!errors.breed_id} aria-describedby={errors.breed_id ? 'breed_id-error' : undefined}>
                  <SelectValue placeholder="Select a breed" />
                </SelectTrigger>
                <SelectContent>
                  {breeds.map((breed) => (
                    <SelectItem key={breed._id} value={breed._id}>
                      {breed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.breed_id && (
                <p id="breed_id-error" className="text-sm text-red-600">
                  {errors.breed_id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_cage_id">Cage *</Label>
              <Select value={formData.current_cage_id} onValueChange={(value) => handleChange('current_cage_id', value)} disabled={isFormSubmitting}>
                <SelectTrigger id="current_cage_id" aria-invalid={!!errors.current_cage_id} aria-describedby={errors.current_cage_id ? 'current_cage_id-error' : undefined}>
                  <SelectValue placeholder="Select a cage" />
                </SelectTrigger>
                <SelectContent>
                  {cages.map((cage) => (
                    <SelectItem key={cage._id} value={cage._id}>
                      {cage.name} ({cage.cage_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.current_cage_id && (
                <p id="current_cage_id-error" className="text-sm text-red-600">
                  {errors.current_cage_id}
                </p>
              )}
            </div>
          </div>

          {/* Status and Source Type */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)} disabled={isFormSubmitting}>
                <SelectTrigger id="status" aria-invalid={!!errors.status} aria-describedby={errors.status ? 'status-error' : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RABBIT_STATUSES.map((status) => (
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

            <div className="space-y-2">
              <Label htmlFor="source_type">Source Type *</Label>
              <Select value={formData.source_type} onValueChange={(value) => handleChange('source_type', value)} disabled={isFormSubmitting}>
                <SelectTrigger id="source_type" aria-invalid={!!errors.source_type} aria-describedby={errors.source_type ? 'source_type-error' : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.source_type && (
                <p id="source_type-error" className="text-sm text-red-600">
                  {errors.source_type}
                </p>
              )}
            </div>
          </div>

          {/* Source Farm (Conditional - only for Purchased/Gifted) */}
          {['Purchased', 'Gifted'].includes(formData.source_type) && (
            <div className="space-y-2">
              <Label htmlFor="source_farm">Source Farm/Seller *</Label>
              <Input
                id="source_farm"
                placeholder="e.g., John's Rabbit Farm or Breeder Name"
                value={formData.source_farm}
                onChange={(e) => handleChange('source_farm', e.target.value)}
                disabled={isFormSubmitting}
                aria-invalid={!!errors.source_farm}
                aria-describedby={errors.source_farm ? 'source_farm-error' : undefined}
              />
              {errors.source_farm && (
                <p id="source_farm-error" className="text-sm text-red-600">
                  {errors.source_farm}
                </p>
              )}
            </div>
          )}

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL (Optional)</Label>
            <Input
              id="photo_url"
              type="url"
              placeholder="e.g., https://example.com/rabbit-photo.jpg"
              value={formData.photo_url}
              onChange={(e) => handleChange('photo_url', e.target.value)}
              disabled={isFormSubmitting}
              aria-invalid={!!errors.photo_url}
              aria-describedby={errors.photo_url ? 'photo_url-error' : undefined}
            />
            {errors.photo_url && (
              <p id="photo_url-error" className="text-sm text-red-600">
                {errors.photo_url}
              </p>
            )}
            {formData.photo_url && (
              <div className="mt-2 flex justify-center">
                <img src={formData.photo_url} alt="Rabbit preview" className="h-32 w-32 rounded-lg object-cover" />
              </div>
            )}
          </div>

          {/* Pregnancy checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="is_pregnant"
              type="checkbox"
              checked={formData.is_pregnant}
              onChange={(e) => handleChange('is_pregnant', e.target.checked)}
              disabled={isFormSubmitting}
              className="h-4 w-4 rounded border border-gray-300 cursor-pointer"
            />
            <Label htmlFor="is_pregnant" className="font-normal cursor-pointer">
              Is Pregnant
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isFormSubmitting}
              className="flex-1"
            >
              {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFormSubmitting ? 'Saving...' : 'Save Rabbit'}
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
