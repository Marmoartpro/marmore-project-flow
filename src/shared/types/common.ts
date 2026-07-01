export type Pagination = { page: number; pageSize: number };
export type PaginatedResult<T> = { rows: T[]; total: number };

export interface ApiError {
  message: string;
  code?: string;
  hint?: string;
}
