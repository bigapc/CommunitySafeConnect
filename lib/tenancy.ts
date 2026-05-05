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

const DEV_ORGANIZATION_ACCESS_CODE = "community-org-demo";
const DEV_ADMIN_ACCESS_CODE = "community-admin-demo";

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

const organizations: OrganizationProfile[] = [
  {
    id: "metro-city-university",
    name: "Metro City University",
    segment: "university",
    plan: "enterprise",
    organizationAccessCode: process.env.MCU_ORGANIZATION_ACCESS_CODE || DEV_ORGANIZATION_ACCESS_CODE,
    adminAccessCode: process.env.MCU_ADMIN_ACCESS_CODE || DEV_ADMIN_ACCESS_CODE,
  },
  {
    id: "saint-mark-church-network",
    name: "Saint Mark Church Network",
    segment: "faith",
    plan: "professional",
    organizationAccessCode: process.env.SMCN_ORGANIZATION_ACCESS_CODE || DEV_ORGANIZATION_ACCESS_CODE,
    adminAccessCode: process.env.SMCN_ADMIN_ACCESS_CODE || DEV_ADMIN_ACCESS_CODE,
  },
  {
    id: "harbor-community-alliance",
    name: "Harbor Community Alliance",
    segment: "community",
    plan: "starter",
    organizationAccessCode: process.env.HCA_ORGANIZATION_ACCESS_CODE || DEV_ORGANIZATION_ACCESS_CODE,
    adminAccessCode: process.env.HCA_ADMIN_ACCESS_CODE || DEV_ADMIN_ACCESS_CODE,
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
