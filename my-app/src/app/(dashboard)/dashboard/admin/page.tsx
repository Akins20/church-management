'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { attendanceService, userService, emailService, adminService, mediaService } from '@/services';
import { Card, Loading, Button } from '@/components/common';
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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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

  // Mock data for charts
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
      value: userStats?.totalUsers || 0,
      change: '+5%',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Email Success Rate',
      value: `${emailStats?.successRate || 95}%`,
      change: emailStats?.failedCount ? `-${emailStats.failedCount} failed` : 'All sent',
      icon: EnvelopeIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Cache Hit Rate',
      value: `${cacheStats?.hitRate || 85}%`,
      change: `${cacheStats?.totalKeys || 0} keys`,
      icon: CpuChipIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Storage Used',
      value: mediaStats?.usedStorage || '2.5 GB',
      change: `of ${mediaStats?.totalStorage || '10 GB'}`,
      icon: CircleStackIcon,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return <Loading fullScreen text="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/settings">
            <Button variant="outline">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Settings
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="primary">
              <UsersIcon className="h-5 w-5 mr-2" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Attendance Trend Chart */}
        <Card title="Weekly Attendance Trend" className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Role Distribution */}
        <Card title="User Role Distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* System Health */}
        <Card title="System Health">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="font-medium text-green-900">API Server</p>
                  <p className="text-sm text-green-700">Running smoothly</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CircleStackIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="font-medium text-green-900">Database</p>
                  <p className="text-sm text-green-700">Connected</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <ServerIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="font-medium text-yellow-900">Queue Worker</p>
                  <p className="text-sm text-yellow-700">{queueStats?.pending ?? queueStats?.waiting ?? 0} jobs pending</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                {(queueStats?.pending ?? queueStats?.waiting ?? 0) > 10 ? 'Busy' : 'Normal'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <CpuChipIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="font-medium text-blue-900">Cache</p>
                  <p className="text-sm text-blue-700">{cacheStats?.hitRate || 85}% hit rate</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">Optimal</span>
            </div>
          </div>
        </Card>

        {/* Admin Quick Actions */}
        <Card title="Admin Actions">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/users">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <UsersIcon className="h-10 w-10 text-blue-600 mb-2" />
                <span className="font-medium text-blue-900">User Management</span>
                <span className="text-xs text-blue-600 mt-1">{userStats?.totalUsers || 0} users</span>
              </div>
            </Link>

            <Link href="/admin/departments">
              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <ChartBarIcon className="h-10 w-10 text-purple-600 mb-2" />
                <span className="font-medium text-purple-900">Departments</span>
                <span className="text-xs text-purple-600 mt-1">Manage structure</span>
              </div>
            </Link>

            <Link href="/admin/queue">
              <div className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                <ServerIcon className="h-10 w-10 text-orange-600 mb-2" />
                <span className="font-medium text-orange-900">Queue Monitor</span>
                <span className="text-xs text-orange-600 mt-1">{queueStats?.pending ?? queueStats?.waiting ?? 0} pending</span>
              </div>
            </Link>

            <Link href="/admin/cache">
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <CpuChipIcon className="h-10 w-10 text-green-600 mb-2" />
                <span className="font-medium text-green-900">Cache Control</span>
                <span className="text-xs text-green-600 mt-1">Manage cache</span>
              </div>
            </Link>

            <Link href="/admin/settings">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <Cog6ToothIcon className="h-10 w-10 text-gray-600 mb-2" />
                <span className="font-medium text-gray-900">System Settings</span>
                <span className="text-xs text-gray-600 mt-1">Configuration</span>
              </div>
            </Link>

            <Link href="/analytics">
              <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                <ArrowTrendingUpIcon className="h-10 w-10 text-indigo-600 mb-2" />
                <span className="font-medium text-indigo-900">Analytics</span>
                <span className="text-xs text-indigo-600 mt-1">View reports</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Failed Jobs Alert */}
      {(queueStats?.failed ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="font-medium text-red-900">Failed Jobs Detected</p>
                <p className="text-sm text-red-700">
                  {queueStats?.failed ?? 0} jobs have failed and need attention
                </p>
              </div>
            </div>
            <Link href="/admin/queue">
              <Button variant="danger" size="sm">
                Review Jobs
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
