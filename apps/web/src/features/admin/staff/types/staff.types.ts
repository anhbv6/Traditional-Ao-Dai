export interface StaffPermissionInput {
  canManageOrders: boolean;
  canUpdateTailoring: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canManageContent?: boolean;
}

export interface StaffMemberItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  staffPermission: {
    id: string;
    canManageOrders: boolean;
    canUpdateTailoring: boolean;
    canManageInventory: boolean;
    canViewReports: boolean;
  } | null;
}
