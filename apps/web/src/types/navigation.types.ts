import type { LucideIcon } from 'lucide-react';
import type { UserRole } from './user.types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: UserRole[];
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
