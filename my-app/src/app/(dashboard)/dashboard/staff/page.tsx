'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { attendanceService, userService, serviceService, emailService, ministryService } from '@/services';
import { Card, Loading, Button } from '@/components/common';
import {
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  EnvelopeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function StaffDashboard() {
  const user = useAppSelector(selectUser);

  const { data: attendanceStats, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendanceStats'],
    queryFn: () => attendanceService.getAttendanceAnalytics(),
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: userService.getUserStats,
  });

  const { data: upcomingServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['upcomingServices'],
    queryFn: serviceService.getUpcomingServices,
  });

  const { data: emailStats, isLoading: emailStatsLoading } = useQuery({
    queryKey: ['emailStats'],
    queryFn: emailService.getEmailStats,
  });

  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ['staffMinistries'],
    queryFn: () => ministryService.getMinistries(1, 20),
  });

  const isLoading = attendanceLoading || userStatsLoading || servicesLoading || emailStatsLoading || ministriesLoading;

  const stats = [
    {
      name: 'Total Members',
      value: userStats?.totalMembers || 0,
      change: userStats?.newMembersThisMonth || 0,
      changeLabel: 'new this month',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Avg Attendance',
      value: (attendanceStats as any)?.summary?.avgAttendancePerDay || (attendanceStats as any)?.averageAttendance || 0,
      change: (attendanceStats as any)?.summary?.attendanceRate || (attendanceStats as any)?.attendanceRate || 0,
      changeLabel: '% rate',
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Active Ministries',
      value: ministries?.data?.length || 0,
      change: ministries?.data?.reduce((acc, m) => acc + (m.members?.length || 0), 0) || 0,
      changeLabel: 'total members',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Emails Sent',
      value: emailStats?.totalSent || 0,
      change: emailStats?.sentThisWeek || 0,
      changeLabel: 'this week',
      icon: EnvelopeIcon,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return <Loading fullScreen text="Loading staff dashboard..." />;
  }

  return (
    <div className="space-y-3">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Here&apos;s your overview.</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/attendance/checkin">
            <Button variant="primary">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
              Check-in
            </Button>
          </Link>
          <Link href="/staff/emails">
            <Button variant="outline">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Send Email
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {stat.change} {stat.changeLabel}
                  </p>
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
        {/* Upcoming Services */}
        <Card title="Upcoming Services" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theme</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingServices && upcomingServices.length > 0 ? (
                  upcomingServices.slice(0, 5).map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(service.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(service.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {service.theme || 'Sunday Service'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          service.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {service.completed ? 'Completed' : 'Upcoming'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/staff/services/${service.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No upcoming services
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/staff/services">
              <Button variant="outline" size="sm">View All Services</Button>
            </Link>
          </div>
        </Card>

        {/* Quick Actions & Notifications */}
        <div className="space-y-3">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link href="/attendance/checkin" className="block">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
                  <span className="ml-3 font-medium text-blue-900">Mark Attendance</span>
                </div>
              </Link>
              <Link href="/staff/sermons" className="block">
                <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                  <span className="ml-3 font-medium text-purple-900">Upload Sermon</span>
                </div>
              </Link>
              <Link href="/staff/emails" className="block">
                <div className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <EnvelopeIcon className="h-6 w-6 text-green-600" />
                  <span className="ml-3 font-medium text-green-900">Send Broadcast</span>
                </div>
              </Link>
              <Link href="/directory" className="block">
                <div className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <UsersIcon className="h-6 w-6 text-orange-600" />
                  <span className="ml-3 font-medium text-orange-900">View Directory</span>
                </div>
              </Link>
            </div>
          </Card>

          <Card title="Notifications">
            <div className="space-y-3">
              <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <BellAlertIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Service Planning</p>
                  <p className="text-xs text-yellow-700">Next Sunday&apos;s service needs planning</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">New Members</p>
                  <p className="text-xs text-blue-700">3 new members this week</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-red-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-900">Failed Emails</p>
                  <p className="text-xs text-red-700">2 emails need retry</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Ministry Overview */}
      <Card title="Ministry Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ministries?.data && ministries.data.length > 0 ? (
            ministries.data.slice(0, 8).map((ministry) => (
              <div
                key={ministry.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{ministry.name}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {ministry.members?.length || 0} members
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{ministry.description}</p>
                <Link
                  href={`/staff/ministries/${ministry.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                >
                  Manage →
                </Link>
              </div>
            ))
          ) : (
            <p className="col-span-full text-gray-500 text-center py-4">No ministries found</p>
          )}
        </div>
      </Card>
    </div>
  );
}
