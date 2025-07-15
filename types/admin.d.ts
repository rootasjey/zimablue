import type { User } from './user'
import type { Image } from './image'
import type { Collection } from './collection'
import type { Message } from './message'
import type { Pagination } from './pagination'

export interface AdminStats {
  users: {
    total: number;
    active: number;
    admins: number;
    newThisMonth: number;
  };
  images: {
    total: number;
    totalViews: number;
    totalDownloads: number;
    totalLikes: number;
  };
  collections: {
    total: number;
    public: number;
    private: number;
    totalViews: number;
  };
  messages: {
    total: number;
    unread: number;
    newToday: number;
  };
}

export interface AdminTableColumn {
  accessorKey: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  cell?: (value: any, row: any) => string;
}

export interface AdminTableData<T = any> {
  data: T[];
  pagination: Pagination;
}

export interface AdminFilters {
  search?: string;
  status?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

export interface AdminBulkAction {
  id: string;
  label: string;
  icon?: string;
  variant?: string;
  confirmMessage?: string;
}

export interface AdminEntityConfig {
  name: string;
  pluralName: string;
  icon: string;
  route: string;
  columns: AdminTableColumn[];
  bulkActions: AdminBulkAction[];
  searchFields: string[];
  filterOptions: Record<string, any[]>;
}
