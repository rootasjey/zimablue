export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  biography: string;
  job: string;
  language: string;
  location: string;
  socials: string;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  biography?: string;
  job?: string;
  language?: string;
  location?: string;
  socials?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}
