'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { attendanceService, userService, emailService, adminService, mediaService } from '@/services';
import { Loading } from '@/components/common';
import {
  UsersIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Apple system colors
const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

const card = 'rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm';

export default function AdminDashboard() {
  const user = useAppSelector(selectUser);

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: userService.getUserStats,
  });

  const { data: attendanceAnalytics, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendanceAnalytics'],
    queryFn: () => attendanceService.getAttendanceAnalytics(),
  });

  const { data: emailStats, isLoading: emailStatsLoading } = useQuery({
    queryKey: ['emailStats'],
    queryFn: emailService.getEmailStats,
  });

  const { data: cacheStats, isLoading: cacheLoading } = useQuery({
    queryKey: ['cacheStats'],
    queryFn: adminService.getCacheStats,
  });

  const { data: queueStats, isLoading: queueLoading } = useQuery({
    queryKey: ['queueStats'],
    queryFn: adminService.getQueueStats,
  });

  const { data: mediaStats, isLoading: mediaLoading } = useQuery({
    queryKey: ['mediaStats'],
    queryFn: mediaService.getMediaStats,
  });

  const isLoading = userStatsLoading || attendanceLoading || emailStatsLoading || cacheLoading || queueLoading || mediaLoading;

  const attendanceTrend = [
    { name: 'Week 1', attendance: 120 },
    { name: 'Week 2', attendance: 135 },
    { name: 'Week 3', attendance: 128 },
    { name: 'Week 4', attendance: 145 },
    { name: 'Week 5', attendance: 152 },
    { name: 'Week 6', attendance: 148 },
  ];

  const roleDistribution = [
    { name: 'Members', value: userStats?.memberCount || 50 },
    { name: 'Staff', value: userStats?.staffCount || 10 },
    { name: 'Newcomers', value: userStats?.newcomerCount || 15 },
    { name: 'Admins', value: userStats?.adminCount || 2 },
  ];

  const systemStats = [
    {
      name: 'Total Users',
      value: userStats?.totalUsers ?? 0,
      change: '+5% this month',
      icon: UsersIcon,
      tint: 'bg-blue-500/10',
      fg: 'text-blue-600',
    },
    {
      name: 'Email Success Rate',
      value: `${emailStats?.successRate ?? 95}%`,
      change: emailStats?.failedCount ? `${emailStats.failedCount} failed` : 'All delivered',
      icon: EnvelopeIcon,
      tint: 'bg-emerald-500/10',
      fg: 'text-emerald-600',
    },
    {
      name: 'Cache Hit Rate',
      value: `${cacheStats?.hitRate ?? 85}%`,
      change: `${cacheStats?.totalKeys ?? 0} keys`,
      icon: CpuChipIcon,
      tint: 'bg-violet-500/10',
      fg: 'text-violet-600',
    },
    {
      name: 'Storage Used',
      value: mediaStats?.usedStorage ?? '2.5 GB',
      change: `of ${mediaStats?.totalStorage ?? '10 GB'}`,
      icon: CircleStackIcon,
      tint: 'bg-amber-500/10',
      fg: 'text-amber-600',
    },
  ];

  const quickActions = [
    { href: '/admin/users', label: 'User Management', sub: `${userStats?.totalUsers ?? 0} users`, icon: UsersIcon, tint: 'bg-blue-500/10', fg: 'text-blue-600' },
    { href: '/admin/departments', label: 'Departments', sub: 'Manage structure', icon: ChartBarIcon, tint: 'bg-violet-500/10', fg: 'text-violet-600' },
    { href: '/admin/queue', label: 'Queue Monitor', sub: `${queueStats?.pending ?? queueStats?.waiting ?? 0} pending`, icon: ServerIcon, tint: 'bg-amber-500/10', fg: 'text-amber-600' },
    { href: '/admin/cache', label: 'Cache Control', sub: 'Manage cache', icon: CpuChipIcon, tint: 'bg-emerald-500/10', fg: 'text-emerald-600' },
    { href: '/admin/settings', label: 'System Settings', sub: 'Configuration', icon: Cog6ToothIcon, tint: 'bg-gray-500/10', fg: 'text-gray-600' },
    { href: '/admin/activity', label: 'Activity Log', sub: 'Audit trail', icon: ClipboardDocumentListIcon, tint: 'bg-rose-500/10', fg: 'text-rose-600' },
    { href: '/analytics', label: 'Analytics', sub: 'View reports', icon: ArrowTrendingUpIcon, tint: 'bg-indigo-500/10', fg: 'text-indigo-600' },
  ];

  const health = [
    { label: 'API Server', sub: 'Running smoothly', icon: ShieldCheckIcon, status: 'Healthy', tone: 'emerald' },
    { label: 'Database', sub: 'Connected', icon: CircleStackIcon, status: 'Healthy', tone: 'emerald' },
    {
      label: 'Queue Worker',
      sub: `${queueStats?.pending ?? queueStats?.waiting ?? 0} jobs pending`,
      icon: ServerIcon,
      status: (queueStats?.pending ?? queueStats?.waiting ?? 0) > 10 ? 'Busy' : 'Normal',
      tone: 'amber',
    },
    { label: 'Cache', sub: `${cacheStats?.hitRate ?? 85}% hit rate`, icon: CpuChipIcon, status: 'Optimal', tone: 'blue' },
  ] as const;

  const toneClasses: Record<string, { dot: string; pill: string; icon: string }> = {
    emerald: { dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-600', icon: 'text-emerald-600' },
    amber: { dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600', icon: 'text-amber-600' },
    blue: { dot: 'bg-blue-500', pill: 'bg-blue-500/10 text-blue-600', icon: 'text-blue-600' },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (isLoading) {
    return <Loading fullScreen text="Loading admin dashboard..." />;
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{today}</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {greeting}{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              Settings
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
            >
              <UsersIcon className="h-4 w-4" />
              Manage Users
            </Link>
          </div>
        </div>

        {/* Stat widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {systemStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className={`${card} p-4 md:p-5`}>
                <div className={`w-11 h-11 rounded-2xl ${stat.tint} ${stat.fg} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          <div className={`${card} p-5 lg:col-span-2`}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Weekly Attendance</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f1f4" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} width={36} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #eee', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  />
                  <Line type="monotone" dataKey="attendance" stroke="#007AFF" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Role Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={4}
                    cornerRadius={6}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: 11 }}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className={`${card} p-5`}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">System Health</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {health.map((h) => {
              const Icon = h.icon;
              const t = toneClasses[h.tone];
              return (
                <div key={h.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/[0.08] flex items-center justify-center ${t.icon}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{h.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">{h.sub}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${t.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                    {h.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 px-1">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`${card} p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${a.tint} ${a.fg} flex items-center justify-center shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{a.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Failed Jobs Alert */}
        {(queueStats?.failed ?? 0) > 0 && (
          <div className="rounded-2xl bg-red-50 ring-1 ring-red-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-red-900">Failed Jobs Detected</p>
                <p className="text-sm text-red-700">{queueStats?.failed ?? 0} jobs need attention</p>
              </div>
            </div>
            <Link
              href="/admin/queue"
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shrink-0"
            >
              Review
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
