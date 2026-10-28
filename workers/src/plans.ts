export type PaidPlanId = "creator" | "studio";
export type BillingInterval = "monthly" | "annual";

export interface Plan {
  id: "free" | PaidPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyLimit: number | null;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Test the analysis quality before integrating.",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyLimit: null,
    features: ["Browser-based hook analysis", "3 calls per IP each hour", "No API key required"],
  },
  {
    id: "creator",
    name: "Creator",
    description: "For independent writers and small content teams.",
    monthlyPrice: 29,
    annualPrice: 278,
    monthlyLimit: 1000,
    features: ["1,000 analyses each month", "Production API key", "Structured JSON output"],
  },
  {
    id: "studio",
    name: "Studio",
    description: "For teams reviewing scripts at higher volume.",
    monthlyPrice: 99,
    annualPrice: 950,
    monthlyLimit: 5000,
    features: ["5,000 analyses each month", "Everything in Creator", "Integration support"],
  },
];

export function getPaidPlan(id: unknown): Plan | undefined {
  return PLANS.find((plan) => plan.id === id && plan.id !== "free");
}

export function getPriceIdEnv(plan: PaidPlanId, interval: BillingInterval): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
}
