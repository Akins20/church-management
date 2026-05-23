'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated, selectUser, setUser } from '@/store/slices/authSlice';
import { authService } from '@/services';
import { DashboardLayout } from '@/components/layout';
import { Loading } from '@/components/common';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user) {
          const currentUser = await authService.getCurrentUser();
          dispatch(setUser(currentUser));
        }
        setIsLoading(false);
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, dispatch, router]);

  if (isLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
