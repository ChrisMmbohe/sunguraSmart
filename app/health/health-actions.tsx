'use client';

import { HealthRecordFormData } from '@/components/HealthRecordForm';

/**
 * Server Action to create a new health record.
 * This connects the form data to the MongoDB database via /api/health
 */
export async function createHealthRecord(
  data: HealthRecordFormData
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to create record');
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Create health record error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action to update an existing health record.
 * This connects the form data to the MongoDB database via /api/health
 */
export async function updateHealthRecord(
  recordId: string,
  data: HealthRecordFormData
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch('/api/health', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id: recordId }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to update record');
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Update health record error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action to delete a health record.
 */
export async function deleteHealthRecord(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/health?id=${recordId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to delete record');
    }

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Delete health record error:', error);
    return { success: false, error: error.message };
  }
}