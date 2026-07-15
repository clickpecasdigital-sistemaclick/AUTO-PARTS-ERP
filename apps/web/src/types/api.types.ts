export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  search?: string;
}
