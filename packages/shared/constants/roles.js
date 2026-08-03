// Single source of truth for roles — imported by both backend (RBAC) and
// frontend (route guards, conditional UI). Keeps AUTH-R-001..003 in sync.

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CANDIDATE: 'candidate',
  VOLUNTEER: 'volunteer',
});

// AUTH-R-003: super_admin > admin > candidate > volunteer
export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.CANDIDATE]: 2,
  [ROLES.VOLUNTEER]: 1,
});

export const USER_STATUS = Object.freeze({
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  DELETED: 'deleted',
});

export function roleAtLeast(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}
