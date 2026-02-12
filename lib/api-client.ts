import { RabbitFormData, RabbitQueryParams } from '@/lib/validations/rabbit';
import { BreedFormData, BreedQueryParams } from '@/lib/validations/breed';
import { CageFormData, CageQueryParams } from '@/lib/validations/cage';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp?: string;
}

/**
 * Client-side API client for rabbits endpoints
 */
export const rabbitsApi = {
  /**
   * Fetch all rabbits with optional filtering and pagination
   */
  async list(params?: Partial<RabbitQueryParams>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/rabbits?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rabbits');
    }

    return response.json() as Promise<PaginatedResponse<any>>;
  },

  /**
   * Create a new rabbit
   */
  async create(data: RabbitFormData) {
    const response = await fetch('/api/rabbits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rabbit');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },

  /**
   * Update an existing rabbit
   */
  async update(id: string, data: Partial<RabbitFormData>) {
    const response = await fetch(`/api/rabbits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update rabbit');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },

  /**
   * Delete a rabbit
   */
  async delete(id: string) {
    const response = await fetch(`/api/rabbits/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete rabbit');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },
};

/**
 * Client-side API client for breeds endpoints
 */
export const breedsApi = {
  /**
   * Fetch all breeds with optional filtering and pagination
   */
  async list(params?: Partial<BreedQueryParams>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/breeds?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch breeds');
    }

    return response.json() as Promise<PaginatedResponse<any>>;
  },

  /**
   * Create a new breed
   */
  async create(data: BreedFormData) {
    const response = await fetch('/api/breeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create breed');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },

  /**
   * Update an existing breed
   */
  async update(id: string, data: Partial<BreedFormData>) {
    const response = await fetch(`/api/breeds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update breed');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },

  /**
   * Delete a breed
   */
  async delete(id: string) {
    const response = await fetch(`/api/breeds/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete breed');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },
};

/**
 * Client-side API client for cages endpoints
 */
export const cagesApi = {
  /**
   * Fetch all cages with optional filtering and pagination
   */
  async list(params?: Partial<CageQueryParams>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/cages?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch cages');
    }

    return response.json() as Promise<PaginatedResponse<any>>;
  },

  /**
   * Create a new cage
   */
  async create(data: CageFormData) {
    const response = await fetch('/api/cages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create cage');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },

  /**
   * Update an existing cage
   */
  async update(id: string, data: Partial<CageFormData>) {
    const response = await fetch(`/api/cages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update cage');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },

  /**
   * Delete a cage
   */
  async delete(id: string) {
    const response = await fetch(`/api/cages/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete cage');
    }

    return response.json() as Promise<ApiResponse<any>>;
  },
};
