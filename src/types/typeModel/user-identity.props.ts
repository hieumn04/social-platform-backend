export interface UserIdentityProps {
  fbidV2: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: Date;
}
