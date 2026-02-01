
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export enum BasketStatus {
  OPEN = 'OPEN',
  DRAFT = 'DRAFT',
  PARTIAL = 'PARTIAL',
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
  planIntent?: string;
  avatarUrl?: string;
  referralCount?: number;
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
  metadata?: any; 
}

export interface Basket {
  id: string;
  userId: string;
  cycleId?: string; 
  month: string; 
  
  items: BasketItem[];
  
  subtotal: number;
  serviceFee: number;
  discount: number; 
  deliveryFee?: number; 
  totalValue: number;
  amountPaid: number;
  balance: number; 

  status: BasketStatus;
  transactions: Transaction[];
  
  topUpRequested?: boolean;
  topUpApproved?: boolean;
  topUpAmount?: number;
  topUpStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'DENIED';
  topUpDenialReason?: string;
  
  deliveryCode?: string;
  pickupTimestamp?: string;
  
  couponCode?: string;
  metadata?: Record<string, any>;
  
  refundRequested?: boolean;
  isRolledOver?: boolean;
  lockedAt?: string; // New field
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
  basketOpenDate?: string | null; 
  basketLockDate?: string | null; 
  deliveryDate?: string | null;
  
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
  branding?: {
    logo?: string;      
    logoWhite?: string; 
  };
  
  // Derived state from cycle
  cycleStatus?: 'OPEN' | 'LOCKED' | 'CLOSED';
}

export interface Cycle {
  id: string;
  name: string;
  month_year?: string; 
  // Update status to include lowercase variants used in DB/logic
  status: 'OPEN' | 'LOCKED' | 'CLOSED' | 'upcoming' | 'active' | 'locked' | 'assessing' | 'closed';
  paymentStartDate?: string | null; // Mapped to open_date
  paymentEndDate?: string | null; // Mapped to lock_date
  lockDate?: string | null;
  standardLockDate?: string | null; // NEW: Free user lock date
  unlockDate?: string | null;
  bulkStartDate?: string | null;
  bulkEndDate?: string | null;
  deliveryDate?: string | null;
  assessmentDate?: string | null; 
  isActive: boolean;
  open_date?: string; // Raw DB
  lock_date?: string; // Raw DB
  standard_lock_date?: string; // Raw DB
}

export type CyclePhase = 
  | 'no_access' 
  | 'upcoming' 
  | 'active' 
  | 'locked' 
  | 'assessing';

export interface CycleAccess {
  canAccess: boolean;
  canAddToCart: boolean;
  canPay: boolean;
  phase: CyclePhase;
  message: string;
  nextCycle?: Cycle;
}

export interface CycleDates {
  open_date?: string | Date;
  lock_date?: string | Date;
  standard_lock_date?: string | Date; // NEW
  assessment_date?: string | Date;
}

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
    deliveryBatch?: string;
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
    
    salesByCategory: { category: string; value: number; count: number }[];
    revenueTrend: { date: string; amount: number }[]; 
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