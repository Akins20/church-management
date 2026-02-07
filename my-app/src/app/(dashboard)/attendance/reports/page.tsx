'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, userService } from '@/services';
import { Card, Button, Loading } from '@/components/common';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  UserCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function AttendanceReports() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMember, setSelectedMember] = useState('');
  const [reportType, setReportType] = useState<'overview' | 'individual' | 'comparison'>('overview');

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['attendanceAnalytics', dateRange],
    queryFn: () => attendanceService.getAttendanceAnalytics(dateRange.start, dateRange.end),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => userService.getUsers({}, 1, 100),
  });

  const { data: memberAttendance, isLoading: memberLoading } = useQuery({
    queryKey: ['memberAttendance', selectedMember],
    queryFn: () => attendanceService.getUserAttendance(selectedMember),
    enabled: !!selectedMember,
  });

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', attendance: 520, average: 130 },
    { month: 'Feb', attendance: 480, average: 120 },
    { month: 'Mar', attendance: 560, average: 140 },
    { month: 'Apr', attendance: 540, average: 135 },
    { month: 'May', attendance: 600, average: 150 },
    { month: 'Jun', attendance: 580, average: 145 },
  ];

  const attendanceBreakdown = [
    { name: 'Present', value: 85 },
    { name: 'Late', value: 8 },
    { name: 'Absent', value: 7 },
  ];

  const serviceComparison = [
    { service: 'Morning', attendance: 150 },
    { service: 'Mid-day', attendance: 80 },
    { service: 'Evening', attendance: 120 },
    { service: 'Youth', attendance: 60 },
  ];

  const isLoading = analyticsLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600">Generate and analyze detailed attendance reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview Report' },
          { id: 'individual', label: 'Individual Report' },
          { id: 'comparison', label: 'Comparison Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as typeof reportType)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              reportType === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {reportType === 'individual' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Member
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a member...</option>
                {members?.data?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <Button variant="primary">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card title="Monthly Attendance Trend">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Total Attendance"
                    />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Weekly Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Attendance Breakdown */}
            <Card title="Attendance Status Breakdown">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {attendanceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Service Comparison */}
          <Card title="Attendance by Service Type">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#3B82F6" name="Average Attendance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Services</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">24</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">3,280</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Average per Service</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">137</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-1">85%</p>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Individual Report */}
      {reportType === 'individual' && selectedMember && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                <UserCircleIcon className="h-full w-full text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {members?.data?.find((m) => m.id === selectedMember)?.firstName}{' '}
                  {members?.data?.find((m) => m.id === selectedMember)?.lastName}
                </h3>
                <p className="text-gray-500">Individual Attendance Report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-600">Total Services</p>
                <p className="text-2xl font-bold text-blue-900">{memberAttendance?.length || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-600">Present</p>
                <p className="text-2xl font-bold text-green-900">
                  {memberAttendance?.filter((a) => a.status === 'present').length || 0}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-sm text-yellow-600">Late</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {memberAttendance?.filter((a) => a.status === 'late').length || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-purple-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-900">
                  {memberAttendance?.length
                    ? Math.round(
                        (memberAttendance.filter((a) => a.status === 'present').length /
                          memberAttendance.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </Card>

          {/* Attendance History */}
          <Card title="Attendance History">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {memberAttendance?.slice(0, 10).map((attendance, idx) => (
                    <tr key={attendance._id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            attendance.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : attendance.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {attendance.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {attendance.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Comparison Report */}
      {reportType === 'comparison' && (
        <Card title="Year-over-Year Comparison">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'Jan', thisYear: 520, lastYear: 480 },
                  { month: 'Feb', thisYear: 480, lastYear: 450 },
                  { month: 'Mar', thisYear: 560, lastYear: 520 },
                  { month: 'Apr', thisYear: 540, lastYear: 510 },
                  { month: 'May', thisYear: 600, lastYear: 550 },
                  { month: 'Jun', thisYear: 580, lastYear: 540 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="thisYear" fill="#3B82F6" name="This Year" />
                <Bar dataKey="lastYear" fill="#9CA3AF" name="Last Year" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
