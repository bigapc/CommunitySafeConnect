import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess, hasOrganizationAccess } from "@/lib/access";
import { canUserAccess, type PermissionKey } from "@/lib/rbac";
import type { UserRole } from "@/lib/localDataStore";

/**
 * Authorization context for API routes
 */
export interface AuthContext {
  role: UserRole;
  username: string;
  hasAdminAccess: boolean;
}

/**
 * Check authorization for a specific permission
 */
export async function checkPermission(
  request: NextRequest,
  requiredPermission: PermissionKey
): Promise<{ authorized: boolean; context?: AuthContext; error?: string }> {
  try {
    // Determine access level from cookies
    const isAdmin = await hasAdminAccess();
    const isOrganization = await hasOrganizationAccess();

    if (!isOrganization && !isAdmin) {
      return {
        authorized: false,
        error: "Unauthorized: No access",
      };
    }

    // Map access level to role
    const role: UserRole = isAdmin ? "admin" : "operator";
    const username = isAdmin ? "admin" : "organization";

    // Check if role has permission
    if (!canUserAccess(role, requiredPermission)) {
      return {
        authorized: false,
        error: `Permission denied: ${requiredPermission}`,
      };
    }

    return {
      authorized: true,
      context: {
        role,
        username,
        hasAdminAccess: isAdmin,
      },
    };
  } catch (error) {
    return {
      authorized: false,
      error: error instanceof Error ? error.message : "Authorization check failed",
    };
  }
}

/**
 * Middleware to enforce permission on an API route
 */
export function requirePermission(requiredPermission: PermissionKey) {
  return async (handler: (req: NextRequest, context: AuthContext) => Promise<Response>) => {
    return async (request: NextRequest) => {
      const { authorized, context, error } = await checkPermission(request, requiredPermission);

      if (!authorized || !context) {
        return NextResponse.json(
          { error: error || "Access denied" },
          { status: 403 }
        );
      }

      try {
        return await handler(request, context);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Internal server error" },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Require at least a specific role
 */
export async function requireRole(
  request: NextRequest,
  minRole: UserRole
): Promise<{ authorized: boolean; context?: AuthContext; error?: string }> {
  try {
    const isAdmin = await hasAdminAccess();
    const isOrganization = await hasOrganizationAccess();

    if (!isOrganization && !isAdmin) {
      return {
        authorized: false,
        error: "Unauthorized: No access",
      };
    }

    const role: UserRole = isAdmin ? "admin" : "operator";
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      operator: 2,
      admin: 3,
    };

    if (roleHierarchy[role] < roleHierarchy[minRole]) {
      return {
        authorized: false,
        error: `Role denied: requires ${minRole}`,
      };
    }

    return {
      authorized: true,
      context: {
        role,
        username: isAdmin ? "admin" : "operator",
        hasAdminAccess: isAdmin,
      },
    };
  } catch (error) {
    return {
      authorized: false,
      error: error instanceof Error ? error.message : "Role check failed",
    };
  }
}
