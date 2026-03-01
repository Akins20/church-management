'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, userService, sermonService } from '@/services';
import { Card, Button, Loading } from '@/components/common';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMetric, setSelectedMetric] = useState<'attendance' | 'members' | 'engagement'>('attendance');

  const { data: attendanceAnalytics, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendanceAnalytics', dateRange],
    queryFn: () => attendanceService.getAttendanceAnalytics(dateRange.start, dateRange.end),
  });

  const { data: memberStats } = useQuery({
    queryKey: ['memberStats'],
    queryFn: () => userService.getUsers({}, 1, 1),
  });

  const { data: sermonStats } = useQuery({
    queryKey: ['sermonStats'],
    queryFn: () => sermonService.getSermons({}, 1, 1),
  });

  // Mock data for comprehensive analytics
  const memberGrowthData = [
    { month: 'Jan', newMembers: 12, totalMembers: 245, churned: 2 },
    { month: 'Feb', newMembers: 18, totalMembers: 261, churned: 3 },
    { month: 'Mar', newMembers: 15, totalMembers: 273, churned: 1 },
    { month: 'Apr', newMembers: 22, totalMembers: 294, churned: 2 },
    { month: 'May', newMembers: 28, totalMembers: 320, churned: 4 },
    { month: 'Jun', newMembers: 20, totalMembers: 336, churned: 2 },
  ];

  const attendanceTrendData = [
    { week: 'Week 1', morning: 145, evening: 98, youth: 42 },
    { week: 'Week 2', morning: 152, evening: 105, youth: 48 },
    { week: 'Week 3', morning: 148, evening: 92, youth: 45 },
    { week: 'Week 4', morning: 160, evening: 110, youth: 52 },
  ];

  const engagementData = [
    { name: 'Highly Active', value: 35, count: 118 },
    { name: 'Active', value: 40, count: 134 },
    { name: 'Occasional', value: 18, count: 60 },
    { name: 'Inactive', value: 7, count: 24 },
  ];

  const ministryParticipation = [
    { ministry: 'Worship', members: 45, percentage: 13 },
    { ministry: 'Youth', members: 62, percentage: 18 },
    { ministry: 'Outreach', members: 38, percentage: 11 },
    { ministry: 'Media', members: 25, percentage: 7 },
    { ministry: 'Children', members: 52, percentage: 15 },
    { ministry: 'Prayer', members: 78, percentage: 23 },
  ];

  const demographicsData = [
    { age: '0-12', male: 25, female: 28 },
    { age: '13-18', male: 35, female: 42 },
    { age: '19-30', male: 58, female: 65 },
    { age: '31-45', male: 48, female: 52 },
    { age: '46-60', male: 32, female: 38 },
    { age: '60+', male: 18, female: 25 },
  ];

  const isLoading = attendanceLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading analytics..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into church growth and engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">336</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+5% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Attendance</p>
              <p className="text-3xl font-bold text-gray-900">285</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+8% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarDaysIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Engagement Rate</p>
              <p className="text-3xl font-bold text-gray-900">75%</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+3% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">New Members (Month)</p>
              <p className="text-3xl font-bold text-gray-900">20</p>
              <div className="flex items-center text-red-600 text-sm mt-1">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                <span>-4 from last month</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <UsersIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Metric Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'attendance', label: 'Attendance' },
          { id: 'members', label: 'Membership' },
          { id: 'engagement', label: 'Engagement' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedMetric(tab.id as typeof selectedMetric)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedMetric === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Attendance Charts */}
      {selectedMetric === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Weekly Attendance by Service">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="morning" fill="#3B82F6" name="Morning Service" />
                  <Bar dataKey="evening" fill="#10B981" name="Evening Service" />
                  <Bar dataKey="youth" fill="#F59E0B" name="Youth Service" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Attendance Rate Distribution">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Membership Charts */}
      {selectedMetric === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Membership Growth Trend">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalMembers"
                    stroke="#3B82F6"
                    fill="#93C5FD"
                    name="Total Members"
                  />
                  <Area
                    type="monotone"
                    dataKey="newMembers"
                    stroke="#10B981"
                    fill="#6EE7B7"
                    name="New Members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Demographics Distribution">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="age" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" fill="#3B82F6" name="Male" />
                  <Bar dataKey="female" fill="#EC4899" name="Female" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Engagement Charts */}
      {selectedMetric === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Ministry Participation">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ministryParticipation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ministry" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="members" fill="#8B5CF6" name="Active Members" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Engagement Breakdown">
            <div className="space-y-4">
              {engagementData.map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm text-gray-500">{item.count} members ({item.value}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Top Performing Services">
          <div className="space-y-4">
            {[
              { name: 'Sunday Morning', attendance: 160, change: '+8%' },
              { name: 'Sunday Evening', attendance: 110, change: '+5%' },
              { name: 'Youth Service', attendance: 52, change: '+12%' },
              { name: 'Mid-week Prayer', attendance: 45, change: '+3%' },
            ].map((service, index) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{service.attendance}</p>
                  <p className="text-xs text-green-600">{service.change}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="New Member Sources">
          <div className="space-y-3">
            {[
              { source: 'Personal Invitation', count: 8, percentage: 40 },
              { source: 'Social Media', count: 5, percentage: 25 },
              { source: 'Website', count: 3, percentage: 15 },
              { source: 'Community Events', count: 2, percentage: 10 },
              { source: 'Other', count: 2, percentage: 10 },
            ].map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{source.source}</span>
                  <span className="text-gray-500">{source.count} ({source.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Stats">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Avg. Service Duration</span>
              <span className="font-bold text-gray-900">1h 45m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">First-Time Visitors (Month)</span>
              <span className="font-bold text-gray-900">28</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="font-bold text-green-600">92%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Ministry Involvement</span>
              <span className="font-bold text-gray-900">67%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
