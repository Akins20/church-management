'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { UserRole } from '@/types';
import { Loading } from '@/components/common';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (allowedRoles && user) {
      const userRole = user.role as UserRole;
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const normalizedRole = String(user.role).toLowerCase();
        switch (normalizedRole) {
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'staff':
            router.push('/dashboard/staff');
            break;
          default:
            router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, allowedRoles, router, redirectTo]);

  if (!isAuthenticated) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    return <Loading fullScreen text="Redirecting..." />;
  }

  return <>{children}</>;
}
