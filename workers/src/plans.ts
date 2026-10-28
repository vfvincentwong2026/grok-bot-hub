export type PaidPlanId = "creator" | "studio";

export interface Plan {
  id: "free" | PaidPlanId;
  name: string;
  description: string;
  priceIdr: number;
  durationDays: number;
  analysisLimit: number | null;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Test the analysis quality before integrating.",
    priceIdr: 0,
    durationDays: 0,
    analysisLimit: null,
    features: ["Browser-based hook analysis", "3 calls per IP each hour", "No API key required"],
  },
  {
    id: "creator",
    name: "Creator",
    description: "For independent writers and small content teams.",
    priceIdr: 449000,
    durationDays: 30,
    analysisLimit: 1000,
    features: ["1,000 analyses over 30 days", "Production API key", "Structured JSON output"],
  },
  {
    id: "studio",
    name: "Studio",
    description: "For teams reviewing scripts at higher volume.",
    priceIdr: 1499000,
    durationDays: 30,
    analysisLimit: 5000,
    features: ["5,000 analyses over 30 days", "Everything in Creator", "Integration support"],
  },
];

export function getPaidPlan(id: unknown): Plan | undefined {
  return PLANS.find((plan) => plan.id === id && plan.id !== "free");
}

export function getPriceIdEnv(plan: PaidPlanId): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_IDR`;
}

export function formatIdr(value: number): string {
  return `Rp${new Intl.NumberFormat("en-US").format(value)}`;
}
