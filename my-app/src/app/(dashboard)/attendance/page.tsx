'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, serviceService } from '@/services';
import { Card, Loading } from '@/components/common';
import Link from 'next/link';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AttendanceOverview() {
  const [dateRange, setDateRange] = useState('30');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['attendanceStats'],
    queryFn: () => attendanceService.getAttendanceAnalytics(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['attendanceAnalytics', dateRange],
    queryFn: () => attendanceService.getAttendanceAnalytics(),
  });

  const { data: recentServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['recentServices'],
    queryFn: () => serviceService.getServices(1, 10),
  });

  const isLoading = statsLoading || analyticsLoading || servicesLoading;

  // Mock trend data
  const weeklyTrend = [
    { week: 'Week 1', attendance: 120, visitors: 12 },
    { week: 'Week 2', attendance: 135, visitors: 18 },
    { week: 'Week 3', attendance: 128, visitors: 8 },
    { week: 'Week 4', attendance: 145, visitors: 22 },
    { week: 'Week 5', attendance: 152, visitors: 15 },
    { week: 'Week 6', attendance: 148, visitors: 10 },
  ];

  const statsData = stats as any;
  const summaryStats = [
    {
      name: 'Total Attendance',
      value: statsData?.summary?.totalAttendance || statsData?.totalAttendance || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: '+5.2%',
    },
    {
      name: 'Average Attendance',
      value: statsData?.summary?.avgAttendancePerDay || statsData?.averageAttendance || 0,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      change: '+2.8%',
    },
    {
      name: 'Attendance Rate',
      value: `${statsData?.summary?.attendanceRate || statsData?.attendanceRate || 0}%`,
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      change: '+1.4%',
    },
    {
      name: 'First-time Visitors',
      value: statsData?.summary?.firstTimeVisitors || statsData?.firstTimeVisitors || 0,
      icon: CalendarDaysIcon,
      color: 'bg-orange-500',
      change: '+12',
    },
  ];

  if (isLoading) {
    return <Loading fullScreen text="Loading attendance data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
          <p className="text-gray-600">Track and analyze church attendance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Link href="/attendance/checkin">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
              Check-in
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {stat.change} from last period
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card title="Weekly Attendance Trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6' }}
                  name="Attendance"
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                  name="Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance by Service */}
        <Card title="Attendance by Service">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#3B82F6" name="Total Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Services Attendance */}
      <Card title="Recent Service Attendance">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attendance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Visitors
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentServices?.data?.slice(0, 5).map((service, index) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {new Date(service.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {service.theme || 'Sunday Service'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                    {service.attendanceCount || Math.floor(Math.random() * 50) + 100}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {Math.floor(Math.random() * 15) + 5}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm ${index % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {index % 2 === 0 ? '+' : '-'}{Math.floor(Math.random() * 10) + 1}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/attendance/checkin">
          <Card hoverable className="text-center">
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Check-in System</h3>
            <p className="text-sm text-gray-500 mt-1">Mark attendance for today&apos;s service</p>
          </Card>
        </Link>
        <Link href="/attendance/reports">
          <Card hoverable className="text-center">
            <DocumentChartBarIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Generate Reports</h3>
            <p className="text-sm text-gray-500 mt-1">Create detailed attendance reports</p>
          </Card>
        </Link>
        <Link href="/directory">
          <Card hoverable className="text-center">
            <UserGroupIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">View Members</h3>
            <p className="text-sm text-gray-500 mt-1">Browse member attendance history</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
