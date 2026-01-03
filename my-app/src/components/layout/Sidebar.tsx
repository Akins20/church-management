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
} from '@heroicons/react/24/outline';

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
    href: '/notepad',
    icon: DocumentTextIcon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
    children: [
      { name: 'Notes', href: '/notepad/notes' },
      { name: 'History', href: '/notepad/history' },
    ],
  },
  {
    name: 'Ministries',
    href: '/ministries',
    icon: BuildingOffice2Icon,
    roles: [UserRole.NEWCOMER, UserRole.MEMBER, UserRole.STAFF, UserRole.ADMIN],
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
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed: externalCollapsed, onToggle }) => {
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

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-72'
      } bg-[#1c1c1e] h-screen text-white flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
              <p className="text-xs text-gray-500">Church Management</p>
            </div>
          </Link>
        )}
        <button
          onClick={handleToggle}
          className={`p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          {collapsed ? (
            <Bars3Icon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href) || isChildActive(item.children);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`w-full flex items-center ${
                        collapsed ? 'justify-center px-3' : 'justify-between px-4'
                      } py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
                        {!collapsed && (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </div>
                      {!collapsed && (
                        <ChevronRightIcon
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Children */}
                    {!collapsed && isExpanded && (
                      <div className="mt-1 ml-4 pl-4 border-l border-gray-800 space-y-1">
                        {item.children?.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`block px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                childActive
                                  ? 'bg-blue-500/20 text-blue-400 font-medium'
                                  : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
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
                    className={`flex items-center ${
                      collapsed ? 'justify-center px-3' : 'px-4'
                    } py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : ''}`} />
                    {!collapsed && (
                      <span className="ml-3 font-medium">{item.name}</span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-gray-800">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-800/50 rounded-xl">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await authService.logout();
                  dispatch(clearUser());
                  router.push('/login');
                } catch (error) {
                  console.error('Logout failed:', error);
                  setIsLoggingOut(false);
                }
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                await authService.logout();
                dispatch(clearUser());
                router.push('/login');
              } catch (error) {
                console.error('Logout failed:', error);
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            className="w-full p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
            title="Sign Out"
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <ArrowRightOnRectangleIcon className="w-5 h-5 mx-auto" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
