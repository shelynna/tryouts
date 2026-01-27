import { z } from 'zod';
import { UserRole, BasketStatus, PickupPoint } from '../types';

// Enums for validation
const UserRoleSchema = z.nativeEnum(UserRole);
const BasketStatusSchema = z.nativeEnum(BasketStatus);
const PickupPointSchema = z.nativeEnum(PickupPoint);

// --- FORM VALIDATION ---
export const RegisterStep1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // path of error
});

export const RegisterStep2Schema = z.object({
    fullName: z.string().min(3, { message: "Full name is required." }).refine(val => val.trim().split(' ').length >= 2, {
        message: "Please enter your first and last name."
    }),
    phoneNumber: z.string().min(10, { message: "Please enter a valid 10-digit phone number." }).regex(/^0[2-9]\d{8}$/, {
        message: "Phone number must be a valid Ghanaian number (e.g., 024...)."
    })
});

export const RegisterStep3Schema = z.object({
    pickupPoint: PickupPointSchema,
    referralCode: z.string().optional()
});


// --- API RESPONSE VALIDATION ---

// Product Schema
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  size: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  image: z.string().optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
  isActive: z.boolean(),
  stockStatus: z.enum(['IN_STOCK', 'SOLD_OUT']),
  stockQuantity: z.number(),
});
export const ProductsSchema = z.array(ProductSchema);

// User Schema (from DB)
export const UserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  pickupPoint: PickupPointSchema,
  role: UserRoleSchema,
  isSubscriber: z.boolean(),
  isEmailVerified: z.boolean(),
  creditBalance: z.number(),
  isBlocked: z.boolean(),
  referralCode: z.string().optional(),
  referredBy: z.string().optional().nullable(),
});
export const AdminUsersSchema = z.array(UserSchema.extend({
    referralCount: z.number().optional()
}));


// Settings Schema
export const SystemSettingsSchema = z.object({
  cycleName: z.string(),
  basketOpenDate: z.string(),
  basketLockDate: z.string(),
  deliveryDate: z.string(),
  isActive: z.boolean(),
  basketServiceFeePercentage: z.number(),
  topUpServiceFeePercentage: z.number(),
  heroImages: z.array(z.string()).optional(),
  legalContent: z.object({
    privacyPolicy: z.string(),
    termsOfService: z.string(),
    refundPolicy: z.string(),
  }).optional().nullable(),
});

// Basket Schemas
const BasketItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  product: ProductSchema.optional(),
});

const TransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  type: z.enum(['PAYMENT', 'SUBSCRIPTION']),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
});

export const BasketSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  cycleId: z.string().uuid().optional(),
  month: z.string(),
  items: z.array(BasketItemSchema),
  subtotal: z.number(),
  serviceFee: z.number(),
  discount: z.number(),
  totalValue: z.number(),
  amountPaid: z.number(),
  status: BasketStatusSchema,
  transactions: z.array(TransactionSchema),
  topUpRequested: z.boolean().optional(),
  topUpApproved: z.boolean().optional(),
  topUpAmount: z.number().optional(),
  deliveryCode: z.string().optional().nullable(),
  pickupTimestamp: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Admin-specific Schemas
export const AdminBasketEntrySchema = z.object({
    basketId: z.string().uuid(),
    userId: z.string().uuid(),
    userName: z.string(),
    status: BasketStatusSchema,
    totalValue: z.number(),
    amountPaid: z.number(),
    itemCount: z.number()
});
export const AdminBasketsSchema = z.array(AdminBasketEntrySchema);

const PickupItemSchema = z.object({
    name: z.string(),
    size: z.string(),
    quantity: z.number()
});

export const PickupListEntrySchema = z.object({
    basketId: z.string().uuid(),
    userId: z.string().uuid(),
    userName: z.string(),
    userPhone: z.string(),
    userPickupPoint: z.string(),
    items: z.array(PickupItemSchema),
    status: BasketStatusSchema,
    deliveryCode: z.string().optional().nullable(),
    pickupTimestamp: z.string().optional().nullable()
});
export const PickupListSchema = z.array(PickupListEntrySchema);

// A simple schema for the Cycle type
export const CycleSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    deliveryDate: z.string().datetime(),
    isActive: z.boolean(),
});

// A simple schema for the generic stats endpoint
export const AdminStatsSchema = z.object({
    projectedRevenue: z.number(),
    collectedRevenue: z.number(),
    completionRate: z.number()
});