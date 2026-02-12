'use client';

import { useState, useCallback } from 'react';
import { rabbitsApi, breedsApi, cagesApi, PaginatedResponse, ApiResponse } from '@/lib/api-client';
import { RabbitFormData, RabbitQueryParams } from '@/lib/validations/rabbit';
import { BreedFormData, BreedQueryParams } from '@/lib/validations/breed';
import { CageFormData, CageQueryParams } from '@/lib/validations/cage';

export interface UseQueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseMutationState<T> {
  data: T | null;
  isPending: boolean;
  error: Error | null;
  isSuccess: boolean;
}

/**
 * Hook for querying rabbits with pagination and filtering
 */
export function useRabbitsQuery(params?: Partial<RabbitQueryParams>) {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await rabbitsApi.list(params);
      setState({ data: result, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [params]);

  // Auto-fetch on mount
  useState(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

/**
 * Hook for creating, updating, and deleting rabbits
 */
export function useRabbitMutations() {
  const [createState, setCreateState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const [updateState, setUpdateState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const [deleteState, setDeleteState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const createRabbit = useCallback(async (data: RabbitFormData) => {
    setCreateState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await rabbitsApi.create(data);
      setCreateState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setCreateState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  const updateRabbit = useCallback(async (id: string, data: Partial<RabbitFormData>) => {
    setUpdateState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await rabbitsApi.update(id, data);
      setUpdateState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setUpdateState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  const deleteRabbit = useCallback(async (id: string) => {
    setDeleteState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await rabbitsApi.delete(id);
      setDeleteState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setDeleteState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  return {
    create: { ...createState, mutate: createRabbit },
    update: { ...updateState, mutate: updateRabbit },
    delete: { ...deleteState, mutate: deleteRabbit },
  };
}

/**
 * Hook for querying breeds with pagination and filtering
 */
export function useBreedsQuery(params?: Partial<BreedQueryParams>) {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await breedsApi.list(params);
      setState({ data: result, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [params]);

  return { ...state, refetch };
}

/**
 * Hook for creating, updating, and deleting breeds
 */
export function useBreedMutations() {
  const [createState, setCreateState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const [updateState, setUpdateState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const [deleteState, setDeleteState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const createBreed = useCallback(async (data: BreedFormData) => {
    setCreateState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await breedsApi.create(data);
      setCreateState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setCreateState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  const updateBreed = useCallback(async (id: string, data: Partial<BreedFormData>) => {
    setUpdateState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await breedsApi.update(id, data);
      setUpdateState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setUpdateState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  const deleteBreed = useCallback(async (id: string) => {
    setDeleteState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await breedsApi.delete(id);
      setDeleteState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setDeleteState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  return {
    create: { ...createState, mutate: createBreed },
    update: { ...updateState, mutate: updateBreed },
    delete: { ...deleteState, mutate: deleteBreed },
  };
}

/**
 * Hook for querying cages with pagination and filtering
 */
export function useCagesQuery(params?: Partial<CageQueryParams>) {
  const [state, setState] = useState<UseQueryState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await cagesApi.list(params);
      setState({ data: result, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [params]);

  return { ...state, refetch };
}

/**
 * Hook for creating, updating, and deleting cages
 */
export function useCageMutations() {
  const [createState, setCreateState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const [updateState, setUpdateState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const [deleteState, setDeleteState] = useState<UseMutationState<any>>({
    data: null,
    isPending: false,
    error: null,
    isSuccess: false,
  });

  const createCage = useCallback(async (data: CageFormData) => {
    setCreateState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await cagesApi.create(data);
      setCreateState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setCreateState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  const updateCage = useCallback(async (id: string, data: Partial<CageFormData>) => {
    setUpdateState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await cagesApi.update(id, data);
      setUpdateState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setUpdateState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  const deleteCage = useCallback(async (id: string) => {
    setDeleteState({ data: null, isPending: true, error: null, isSuccess: false });
    try {
      const result = await cagesApi.delete(id);
      setDeleteState({ data: result, isPending: false, error: null, isSuccess: true });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setDeleteState({ data: null, isPending: false, error: err, isSuccess: false });
      throw err;
    }
  }, []);

  return {
    create: { ...createState, mutate: createCage },
    update: { ...updateState, mutate: updateCage },
    delete: { ...deleteState, mutate: deleteCage },
  };
}
