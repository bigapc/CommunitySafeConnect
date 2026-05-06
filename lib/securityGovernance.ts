export interface GovernanceRole {
  key: string;
  label: string;
  level: number;
  category: "user" | "organization" | "armstrong";
  permissions: string[];
}

export const DOCUMENTATION_POLICY = {
  model: "documentation-first",
  defaultRetention: "preserved_by_default",
  standardUserDeletion: false,
  organizationDeletion: false,
  projectAuthorityRoutineDeletion: false,
  extraordinaryAccessAuthority: "armstrong_senior_security",
};

export const GOVERNANCE_CONTACT = {
  email: process.env.ARMSTRONG_SECURITY_EMAIL || "security@armstrongpackcompany.com",
  phone: process.env.ARMSTRONG_SECURITY_PHONE || "+1-000-000-0000",
};

export const GOVERNANCE_ROLES: GovernanceRole[] = [
  {
    key: "community_member",
    label: "Community member",
    level: 10,
    category: "user",
    permissions: ["trigger_sos", "view_own_alerts", "view_own_incident_log", "manage_own_safety_circle"],
  },
  {
    key: "trusted_contact",
    label: "Trusted contact",
    level: 20,
    category: "user",
    permissions: ["receive_circle_alerts", "acknowledge_check_in", "view_shared_status"],
  },
  {
    key: "verified_responder",
    label: "Verified responder",
    level: 30,
    category: "user",
    permissions: ["receive_eligible_alerts", "update_responder_status", "add_response_notes"],
  },
  {
    key: "safe_location_manager",
    label: "Safe location manager",
    level: 40,
    category: "user",
    permissions: ["manage_safe_zone_profile", "submit_location_updates", "request_location_review"],
  },
  {
    key: "staff_viewer",
    label: "Staff viewer",
    level: 50,
    category: "organization",
    permissions: ["view_organization_records", "annotate_records"],
  },
  {
    key: "organization_leader",
    label: "Organization leader",
    level: 60,
    category: "organization",
    permissions: ["review_records", "export_documentation", "mark_status"],
  },
  {
    key: "compliance_officer",
    label: "Compliance officer",
    level: 70,
    category: "organization",
    permissions: ["run_compliance_review", "request_restricted_review", "approve_policy_workflows"],
  },
  {
    key: "project_authority",
    label: "Project authority",
    level: 80,
    category: "organization",
    permissions: ["review_escalated_records", "approve_operational_actions", "submit_restricted_access_requests"],
  },
  {
    key: "senior_security_administrator",
    label: "Senior security administrator",
    level: 90,
    category: "armstrong",
    permissions: ["final_security_review", "exceptional_access_coordination", "audit_review"],
  },
  {
    key: "executive_review_authority",
    label: "Executive review authority",
    level: 100,
    category: "armstrong",
    permissions: ["sensitive_escalation_approval", "controlled_legal_actions", "final_redaction_review"],
  },
];

export const DASHBOARD_GOVERNANCE_ACTIONS = [
  "Archive for review",
  "Mark as resolved",
  "Escalate for security review",
  "Export documentation",
  "Request restricted access",
  "Submit to compliance review",
];
