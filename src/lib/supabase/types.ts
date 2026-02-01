
export interface SubscriptionFeature {
  icon: string;
  name: string;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  price_amount: number;
  price_currency: string;
  billing_period: 'forever' | 'monthly' | 'quarterly' | 'semester' | 'yearly';
  billing_period_days?: number;
  is_active: boolean;
  features: SubscriptionFeature[];
  display_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}

export interface CreditFacility {
  id: string;
  user_id: string;
  plan_code: 'standard' | 'sml';
  credit_limit: number;
  available_credit: number;
  used_credit: number;
  outstanding_balance: number;
  interest_rate: number;
  is_active: boolean;
}

export interface CreditTransaction {
  id: string;
  credit_facility_id: string;
  user_id: string;
  type: 'top_up' | 'purchase' | 'repayment' | 'interest_charge' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface ExclusiveDeal {
  id: string;
  name: string;
  description: string;
  eligible_plans: string[];
  product_ids: string[];
  discount_percentage?: number;
  discount_amount?: number;
  is_active: boolean;
  access_start: string;
  access_end: string;
  total_allowed_claims?: number;
  claimed_count: number;
  remaining_claims?: number;
  user_claimed_count?: number;
}

export interface DealClaim {
  id: string;
  user_id: string;
  deal_id: string;
  status: 'claimed' | 'redeemed' | 'expired';
  claimed_at: string;
  deal?: ExclusiveDeal;
}

export interface UserPlanContext {
  planCode: 'standard' | 'sml';
  subscription: UserSubscription | null;
  credit: CreditFacility | null;
  features: {
    hasCredit: boolean;
    hasPriorityProcessing: boolean;
    hasPrioritySupport: boolean;
    hasExclusiveDeals: boolean;
    creditLimit: number;
    availableCredit: number;
    priorityLevel: number;
  };
}
