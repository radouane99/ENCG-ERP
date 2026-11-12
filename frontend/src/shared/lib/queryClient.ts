import { QueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount: number, error: unknown) => {
          const status = (error as AxiosError)?.response?.status;
          if (status === 401 || status === 403) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export let queryClient = createQueryClient()

export function resetPrivateQueryClient() {
  const previous = queryClient
  queryClient = createQueryClient()
  void previous.cancelQueries()
  previous.clear()
}
