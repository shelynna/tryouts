
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export enum BasketStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  PAID = 'PAID',
  DELIVERED = 'DELIVERED',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED'
}

export enum PickupPoint {
  CONTI = 'Conti',
  AFRICA = 'Africa',
  QUEENS = 'Queens',
  REPUBLIC = 'Republic',
  INDECE = 'Indece',
  SRC = 'SRC',
  KATANGA = 'Katanga',
  HALL_7 = 'Hall 7',
  BRUNEI = 'Brunei'
}

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  pickupPoint: PickupPoint;
  role: UserRole;
  isSubscriber: boolean;
  creditBalance: number;
  isBlocked: boolean;
  isEmailVerified: boolean; 
  referralCode?: string;
  referredBy?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  size: string;
  price: number;
  description: string;
  isActive: boolean;
  stockStatus: 'IN_STOCK' | 'SOLD_OUT';
  stockQuantity: number;
  // UI expects 'image' string, DB has 'images' array. We map this in API.
  image?: string; 
  images?: string[]; 
  metadata?: Record<string, any>;
}

export interface BasketItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product; 
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'PAYMENT' | 'SUBSCRIPTION';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export interface Basket {
  id: string;
  userId: string;
  cycleId?: string; // Link to specific cycle
  month: string; // Virtual, for UI display (derived from cycle name)
  
  items: BasketItem[];
  
  subtotal: number;
  serviceFee: number;
  totalValue: number;
  amountPaid: number;

  status: BasketStatus;
  transactions: Transaction[];
  
  topUpRequested?: boolean;
  topUpApproved?: boolean;
  topUpAmount?: number;
  
  // Delivery
  deliveryCode?: string;
  pickupTimestamp?: string;
}

export interface SystemSettings {
  cycleName: string;
  basketOpenDate: string;
  basketLockDate: string;
  deliveryDate: string;
  isActive: boolean;
  basketServiceFeePercentage: number;
  topUpServiceFeePercentage: number;
  heroImages?: string[]; 
  legalContent?: {
    privacyPolicy: string;
    termsOfService: string;
    refundPolicy: string;
  };
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deliveryDate: string;
  isActive: boolean;
}

// Admin Types
export interface ProcurementItem {
  productId: string;
  productName: string;
  unitSize: string;
  totalQuantity: number;
  unitPrice: number;
  totalCost: number;
}

export interface PickupListEntry {
  basketId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userPickupPoint: string;
  items: { name: string; size: string; quantity: number }[];
  status: BasketStatus;
  deliveryCode?: string;
  pickupTimestamp?: string;
}

export interface AdminBasketEntry {
    basketId: string;
    userId: string;
    userName: string;
    status: BasketStatus;
    totalValue: number;
    amountPaid: number;
    itemCount: number;
}

export interface TopUpRequest {
  id: string;
  userId: string;
  basketId: string;
  amount: number; 
  totalRepayable: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  denialReason?: string;
}
