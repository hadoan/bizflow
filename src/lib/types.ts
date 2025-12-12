// Shared base types for Bizflow

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type DateRange = {
  from: Date;
  to: Date;
};

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpaceContext {
  spaceId: string;
  userId: string;
}
