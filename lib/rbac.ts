import type { UserRole } from "@/lib/localDataStore";

/**
 * Define all possible permissions in the system
 * Using a flat structure for simplicity, but can be extended
 */
export const PERMISSIONS = {
  // Reports
  "reports:create": "Create new safety reports",
  "reports:read": "View reports",
  "reports:review": "Review and mark reports as handled",
  "reports:delete": "Delete reports",

  // Chat & Messages
  "messages:send": "Send chat messages",
  "messages:read": "Read chat messages",
  "messages:flag": "Flag/moderate messages",
  "messages:delete": "Delete messages",

  // Command Center Access
  "command-center:access": "Access command center",
  "command-center:reports": "View command center reports",
  "command-center:messages": "View command center messages",
  "command-center:audit": "View audit logs",

  // User Management
  "users:list": "List all users",
  "users:manage": "Create/update/delete users",
  "users:roles": "Manage user roles",

  // MFA Management
  "mfa:setup": "Setup MFA for users",
  "mfa:manage": "Manage MFA settings",

  // Admin Functions
  "admin:access": "Access admin panel",
  "admin:settings": "Modify system settings",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Define role-to-permission mappings
 * More permissions = more privileges
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  user: [
    "reports:create",
    "reports:read",
    "messages:send",
    "messages:read",
  ],

  operator: [
    // All user permissions
    "reports:create",
    "reports:read",
    "messages:send",
    "messages:read",

    // Command center access
    "command-center:access",
    "command-center:reports",
    "command-center:messages",
    "messages:flag",

    // Limited user management (view only)
    "users:list",
  ],

  admin: [
    // All permissions
    ...Object.keys(PERMISSIONS) as PermissionKey[],
  ],
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user can perform an action
 */
export function canUserAccess(role: UserRole, action: PermissionKey): boolean {
  return roleHasPermission(role, action);
}

/**
 * Get permission details
 */
export function getPermissionDetails(permission: PermissionKey) {
  return PERMISSIONS[permission] || "Unknown permission";
}

/**
 * Compare roles by privilege level
 */
export function getRolePrivilegeLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    user: 1,
    operator: 2,
    admin: 3,
  };
  return levels[role] || 0;
}

/**
 * Check if one role outranks another
 */
export function roleOutranks(role1: UserRole, role2: UserRole): boolean {
  return getRolePrivilegeLevel(role1) > getRolePrivilegeLevel(role2);
}
