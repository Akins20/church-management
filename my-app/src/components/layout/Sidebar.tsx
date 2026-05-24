'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUserRole, selectUser, clearUser } from '@/store/slices/authSlice';
import { UserRole } from '@/types';
import { authService } from '@/services';
import {
  UserGroupIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Bars3Icon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  children?: SubItem[];
}

// Helper to check if user role matches allowed roles (case-insensitive)
const roleMatches = (userRole: string | UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  const normalizedUserRole = String(userRole).toLowerCase();
  return allowedRoles.some(role => String(role).toLowerCase() === normalizedUserRole);
};

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'People',
    href: '/people',
    icon: UserGroupIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
    children: [
      { name: 'Check-in', href: '/people/checkin' },
      { name: 'History', href: '/people/history' },
    ],
  },
  {
    name: 'Message',
    href: '/message',
    icon: EnvelopeIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
    children: [
      { name: 'Compose', href: '/message/email' },
      { name: 'History', href: '/message/history' },
    ],
  },
  {
    name: 'Notepad',
    href: '/notepad/notes',
    icon: DocumentTextIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Ministries',
    href: '/ministries',
    icon: BuildingOffice2Icon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
  {
    name: 'Activity',
    href: '/admin/activity',
    icon: ClipboardDocumentListIcon,
    roles: [UserRole.ADMIN],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed: externalCollapsed, onToggle, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userRole = useAppSelector(selectUserRole);
  const user = useAppSelector(selectUser);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use external collapse state if provided
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : isCollapsed;

  // Auto-expand parent when child is active
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setExpandedItems(prev =>
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    });
  }, [pathname]);

  const filteredNav = navigationItems.filter((item) =>
    roleMatches(userRole, item.roles)
  );

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isChildActive = (children?: SubItem[]) => {
    return children?.some(child => pathname === child.href || pathname.startsWith(child.href));
  };

  const toggleExpand = (name: string) => {
    if (collapsed) return;
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      dispatch(clearUser());
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-gray-100/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border-r border-black/[0.06] dark:border-white/[0.08] h-screen text-gray-900 dark:text-gray-100 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="px-3 h-14 flex items-center justify-between shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[10px] flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-bold text-base">M</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">Mount Zion</h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight truncate">Chapel</p>
            </div>
          </Link>
        )}
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors md:hidden"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <button
            onClick={handleToggle}
            className={`p-1.5 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors hidden md:block ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <Bars3Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {!collapsed && (
          <p className="px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Menu
          </p>
        )}
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const childActive = isChildActive(item.children);
            const active = isActive(item.href) || childActive;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`w-full flex items-center ${
                        collapsed ? 'justify-center px-2' : 'justify-between px-3'
                      } py-2 rounded-lg transition-colors ${
                        childActive
                          ? 'bg-black/[0.06] dark:bg-white/[0.08] text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${childActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        {!collapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronRightIcon
                          className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Children */}
                    {!collapsed && isExpanded && (
                      <div className="mt-0.5 ml-[26px] pl-2.5 border-l border-black/[0.08] dark:border-white/[0.08] space-y-0.5">
                        {item.children?.map((child) => {
                          const cActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                cActive
                                  ? 'bg-blue-500 text-white font-medium shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                              }`}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center ${
                      collapsed ? 'justify-center px-2' : 'px-3 gap-2.5'
                    } py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                    {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        {!collapsed ? (
          <div className="space-y-1.5">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 px-2 py-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
          <ThemeToggle collapsed />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full p-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Sign Out"
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <ArrowRightOnRectangleIcon className="w-5 h-5 mx-auto" />
            )}
          </button>
          </div>
        )}
      </div>
    </div>
  );
};
