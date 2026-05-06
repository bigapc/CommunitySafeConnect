export type OrganizationPlanTier = "starter" | "professional" | "enterprise";

export interface OrganizationProfile {
  id: string;
  name: string;
  segment: "university" | "faith" | "community" | "municipal";
  plan: OrganizationPlanTier;
  organizationAccessCode: string;
  adminAccessCode: string;
}

export interface PlanLimits {
  monthlyReports: number;
  monthlyMessages: number;
  maxModerators: number;
  maxAnalysts: number;
}

export type BillingPlanCode = "basic" | "premium" | "elite";

export interface BillingPlanProfile {
  code: BillingPlanCode;
  label: string;
  monthlyBaseUsd: number;
  reportUnitUsd: number;
  messageUnitUsd: number;
  includes: string[];
}

function getRequiredAccessCode(name: string, fallbackName: "ORGANIZATION_ACCESS_CODE" | "ADMIN_ACCESS_CODE") {
  const value = process.env[name] || process.env[fallbackName];

  if (!value) {
    throw new Error(`${name} (or ${fallbackName}) is not configured.`);
  }

  return value;
}

const planLimits: Record<OrganizationPlanTier, PlanLimits> = {
  starter: {
    monthlyReports: 250,
    monthlyMessages: 2000,
    maxModerators: 4,
    maxAnalysts: 10,
  },
  professional: {
    monthlyReports: 1200,
    monthlyMessages: 12000,
    maxModerators: 12,
    maxAnalysts: 40,
  },
  enterprise: {
    monthlyReports: 10000,
    monthlyMessages: 100000,
    maxModerators: 60,
    maxAnalysts: 250,
  },
};

const billingPlans: BillingPlanProfile[] = [
  {
    code: "basic",
    label: "Basic",
    monthlyBaseUsd: 199,
    reportUnitUsd: 1.25,
    messageUnitUsd: 0.08,
    includes: ["Core reporting", "Org dashboard", "Standard chat"],
  },
  {
    code: "premium",
    label: "Premium",
    monthlyBaseUsd: 699,
    reportUnitUsd: 0.95,
    messageUnitUsd: 0.06,
    includes: ["Advanced moderation", "Incident queue", "Evidence workflow"],
  },
  {
    code: "elite",
    label: "Elite",
    monthlyBaseUsd: 1499,
    reportUnitUsd: 0.65,
    messageUnitUsd: 0.04,
    includes: ["Command center suite", "Priority support", "Compliance exports"],
  },
];

const organizations: OrganizationProfile[] = [
  {
    id: "metro-city-university",
    name: "Metro City University",
    segment: "university",
    plan: "enterprise",
    organizationAccessCode: getRequiredAccessCode("MCU_ORGANIZATION_ACCESS_CODE", "ORGANIZATION_ACCESS_CODE"),
    adminAccessCode: getRequiredAccessCode("MCU_ADMIN_ACCESS_CODE", "ADMIN_ACCESS_CODE"),
  },
  {
    id: "saint-mark-church-network",
    name: "Saint Mark Church Network",
    segment: "faith",
    plan: "professional",
    organizationAccessCode: getRequiredAccessCode("SMCN_ORGANIZATION_ACCESS_CODE", "ORGANIZATION_ACCESS_CODE"),
    adminAccessCode: getRequiredAccessCode("SMCN_ADMIN_ACCESS_CODE", "ADMIN_ACCESS_CODE"),
  },
  {
    id: "harbor-community-alliance",
    name: "Harbor Community Alliance",
    segment: "community",
    plan: "starter",
    organizationAccessCode: getRequiredAccessCode("HCA_ORGANIZATION_ACCESS_CODE", "ORGANIZATION_ACCESS_CODE"),
    adminAccessCode: getRequiredAccessCode("HCA_ADMIN_ACCESS_CODE", "ADMIN_ACCESS_CODE"),
  },
];

export function listOrganizations() {
  return organizations;
}

export function getDefaultOrganizationId() {
  return process.env.DEFAULT_ORGANIZATION_ID || organizations[0]?.id || "metro-city-university";
}

export function getOrganizationById(organizationId: string) {
  return organizations.find((organization) => organization.id === organizationId) || null;
}

export function getPlanLimits(tier: OrganizationPlanTier) {
  return planLimits[tier];
}

export function listBillingPlans() {
  return billingPlans;
}

export function getBillingPlanByCode(code: BillingPlanCode) {
  return billingPlans.find((plan) => plan.code === code) || null;
}

export function mapOrganizationPlanToBilling(plan: OrganizationPlanTier): BillingPlanCode {
  if (plan === "starter") {
    return "basic";
  }

  if (plan === "professional") {
    return "premium";
  }

  return "elite";
}
