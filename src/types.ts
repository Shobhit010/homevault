export type CategoryType = 'electronics' | 'documents' | 'furniture' | 'appliances' | 'assets' | 'household';

export interface Asset {
  id: string;
  name: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  description: string;
  category: CategoryType;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate?: number; // % annual
  store: string;
  warrantyProvider: string;
  warrantyExpiry: string;
  warrantyActive: boolean;
  room: string;
  storageLocation: string; // cabinet, shelf, etc
  tags: string[];
  imageUrl?: string;
  notes?: string;
  documentIds?: string[];
  history?: {
    date: string;
    value: number;
    notes: string;
  }[];
  maintenanceStreak?: number; // gamification
  completionRate: number; // gamification percentage (calculated from fields filled)
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'warranty' | 'manual' | 'certificate' | 'insurance';
  uploadDate: string;
  fileSize: string;
  fileUrl: string;
  tags: string[];
  assetId?: string;
  ocrContent?: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'warranty' | 'service' | 'insurance' | 'document';
  date: string;
  assetId?: string;
  assetName?: string;
  completed: boolean;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  type: 'create' | 'update' | 'delete' | 'maintenance' | 'document';
}

export interface RoomLayout {
  id: string;
  name: string;
  color: string;
  assetIds: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  tier: 'free' | 'premium';
  storageUsed: string; // e.g., "4.2 MB"
  storageLimit: string; // e.g., "100 MB" (free) vs "Unlimited"
  organizationScore: number; // dashboard gamification 1-100
}

export interface SmartInsight {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  cta?: string;
}
