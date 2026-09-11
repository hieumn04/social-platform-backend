export interface RoleProps {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
  isSystemRole: boolean;
}
