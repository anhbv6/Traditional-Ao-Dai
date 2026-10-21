export interface CustomerMeasurementProfile {
  id: string;
  profileName: string;
  isDefault: boolean;
  height?: number | null;
  weight?: number | null;
  bust?: number | null;
  waist?: number | null;
  hips?: number | null;
  shoulder?: number | null;
  armLength?: number | null;
  neck?: number | null;
  shirtLength?: number | null;
  pantsLength?: number | null;
  note?: string | null;
}

export interface AdminCustomerItem {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  ordersCount: number;
  totalSpent: number;
  measurements: CustomerMeasurementProfile[];
  createdAt: Date | string;
}
