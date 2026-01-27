
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
  type: 'PAYMENT' | 'SUBSCRIPTION' | 'REFUND';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
}

export interface Basket {
  id: string;
  userId: string;
  cycleId?: string; // Link to specific cycle
  month: string; // Virtual, for UI display (derived from cycle name)
  
  items: BasketItem[];
  
  subtotal: number;
  serviceFee: number;
  discount: number; // Added for coupon logic
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
  
  // Metadata for coupons
  couponCode?: string;
  metadata?: Record<string, any>;
}

export interface Delivery {
  id: string;
  deliveryCode: string;
  basketId: string;
  userId: string;
  fullName: string;
  phone: string;
  pickupPoint: string;
  batchName: string;
  status: 'READY' | 'COLLECTED';
  lockedAt: string;
  pickedUpAt?: string;
  pickedUpBy?: string;
}

export interface SystemSettings {
  cycleName: string;
  // Main Dates for UI (Legacy Mapped)
  basketOpenDate?: string | null; // mapped to paymentStartDate
  basketLockDate?: string | null; // mapped to lockDate
  deliveryDate?: string | null;
  
  // Granular Dates (Admin Freedom)
  paymentStartDate?: string | null;
  paymentEndDate?: string | null;
  lockDate?: string | null;
  unlockDate?: string | null;
  bulkStartDate?: string | null;
  bulkEndDate?: string | null;
  
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
  paymentStartDate?: string | null;
  paymentEndDate?: string | null;
  lockDate?: string | null;
  unlockDate?: string | null;
  bulkStartDate?: string | null;
  bulkEndDate?: string | null;
  deliveryDate?: string | null;
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

export interface AdminStats {
    projectedRevenue: number;
    collectedRevenue: number;
    completionRate: number;
    totalOrders: number;
    avgOrderValue: number;
    
    // Charts Data
    salesByCategory: { category: string; value: number; count: number }[];
    revenueTrend: { date: string; amount: number }[]; // Last 7 days
    topProducts: { name: string; sold: number; revenue: number }[];
    statusBreakdown: Record<string, number>;
}

export interface Coupon {
    id: string;
    code: string;
    associateName: string;
    isActive: boolean;
}

export interface AssociateReport {
    associateName: string;
    couponCode: string;
    month: string;
    activeUsers: number;
}
