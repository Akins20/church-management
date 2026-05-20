'use client';

import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserRole } from '@/store/slices/authSlice';
import { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

// Helper to normalize role for comparison
const normalizeRole = (role: string | UserRole | undefined): string => {
  if (!role) return '';
  return String(role).toLowerCase();
};

// Helper to check if a role matches allowed roles
const roleMatches = (userRole: string | UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.some(role => normalizeRole(role) === normalizedUserRole);
};

/**
 * Component that conditionally renders children based on user role
 * Use this for showing/hiding UI elements based on role
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const userRole = useAppSelector(selectUserRole);

  if (!roleMatches(userRole, allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has a specific role
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const userRole = useAppSelector(selectUserRole);
  return roleMatches(userRole, allowedRoles);
}

/**
 * Hook to check if current user is at least a certain role level
 */
export function useHasMinimumRole(minimumRole: UserRole): boolean {
  const userRole = useAppSelector(selectUserRole);

  if (!userRole) return false;

  const roleHierarchy: Record<string, number> = {
    'newcomer': 0,
    'member': 1,
    'staff': 2,
    'admin': 3,
  };

  const normalizedUserRole = normalizeRole(userRole);
  const normalizedMinRole = normalizeRole(minimumRole);

  return (roleHierarchy[normalizedUserRole] ?? -1) >= (roleHierarchy[normalizedMinRole] ?? -1);
}

/**
 * Hook to get current user's permissions
 */
export function usePermissions() {
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);

  const normalizedRole = normalizeRole(userRole);

  const isAdmin = normalizedRole === 'admin';
  const isStaff = normalizedRole === 'staff';
  const isMember = normalizedRole === 'member';
  const isNewcomer = normalizedRole === 'newcomer';

  const canManageUsers = isAdmin;
  const canManageAttendance = isStaff || isAdmin;
  const canManageMinistries = isStaff || isAdmin;
  const canManageSermons = isStaff || isAdmin;
  const canManageServices = isStaff || isAdmin;
  const canSendEmails = isStaff || isAdmin;
  const canManageMedia = isStaff || isAdmin;
  const canViewAnalytics = isStaff || isAdmin;
  const canAccessAdmin = isAdmin;
  const canViewDirectory = !isNewcomer;
  const canJoinMinistries = isMember || isStaff || isAdmin;

  return {
    user,
    userRole,
    canManageUsers,
    canManageAttendance,
    canManageMinistries,
    canManageSermons,
    canManageServices,
    canSendEmails,
    canManageMedia,
    canViewAnalytics,
    canAccessAdmin,
    canViewDirectory,
    canJoinMinistries,
  };
}
