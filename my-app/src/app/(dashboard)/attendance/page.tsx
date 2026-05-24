'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services';
import Link from 'next/link';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 8;

export default function AttendanceOverview() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [page, setPage] = useState(1);

  // Fetch attendance for the selected date
  const dateStr = selectedDate.toISOString().split('T')[0];
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const { data: dateAttendance, isLoading: dateLoading } = useQuery({
    queryKey: ['attendance', 'byDate', dateStr, page],
    queryFn: () =>
      attendanceService.getAttendance(
        {
          startDate: selectedDate.toISOString(),
          endDate: nextDay.toISOString(),
        },
        page,
        ITEMS_PER_PAGE
      ),
  });

  // Fetch recent attendance (last 4 records, no date filter)
  const { data: recentData } = useQuery({
    queryKey: ['attendance', 'recent'],
    queryFn: () => attendanceService.getAttendance({}, 1, 4),
    staleTime: 5 * 60 * 1000,
  });

  const recentRecords = (recentData as any)?.attendance || [];

  // Fetch analytics (cached, runs once)
  const { data: analytics } = useQuery({
    queryKey: ['attendanceAnalytics'],
    queryFn: () => attendanceService.getAttendanceAnalytics(),
    staleTime: 5 * 60 * 1000,
  });

  const analyticsData = analytics as any;
  const records = (dateAttendance as any)?.attendance || [];
  const totalRecords = (dateAttendance as any)?.total || 0;
  const totalPages = (dateAttendance as any)?.totalPages || 1;

  const stats = [
    {
      label: 'Total Attendance',
      value: analyticsData?.summary?.totalAttendance || 0,
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Avg Per Service',
      value: analyticsData?.summary?.avgAttendancePerDay || 0,
      icon: ChartBarIcon,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Service Days',
      value: analyticsData?.summary?.totalDays || 0,
      icon: CalendarDaysIcon,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'First Timers',
      value: analyticsData?.summary?.firstTimeVisitors || 0,
      icon: ArrowTrendingUpIcon,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setPage(1);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d <= today) {
      setSelectedDate(d);
      setPage(1);
    }
  };

  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setPage(1);
  };

  const isToday = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate.getTime() === today.getTime();
  })();

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--';
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Attendance</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">
              View attendance records by date
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/attendance/history"
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              History by group
            </Link>
            <Link
              href="/people/checkin"
              className="flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors text-sm"
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
              Check-in
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 md:px-6 py-3 shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-3 flex items-center space-x-3"
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Navigator */}
      <div className="px-4 md:px-6 py-2 shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <p className="text-sm md:text-base font-semibold text-gray-900">
                {formatDate(selectedDate)}
              </p>
              <p className="text-xs text-gray-500">
                {totalRecords} record{totalRecords !== 1 ? 's' : ''}
                {isToday && (
                  <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                    Today
                  </span>
                )}
              </p>
            </div>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <div className="flex-1 px-4 md:px-6 pb-4 min-h-0 flex flex-col">
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col">
          {/* Table Header - Desktop */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase shrink-0">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Check-in</div>
            <div className="col-span-2">Check-out</div>
            <div className="col-span-2">Marked By</div>
          </div>

          {/* Records */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {dateLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="p-4 md:p-4">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <CalendarDaysIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    {isToday ? 'No one has checked in today yet' : 'No records for this date'}
                  </p>
                  {isToday && (
                    <Link
                      href="/people/checkin"
                      className="mt-3 flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors text-sm"
                    >
                      <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                      Start Check-in
                    </Link>
                  )}
                </div>

                {/* Recent Attendance */}
                {recentRecords.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Recent Attendance
                    </h3>
                    <div className="divide-y divide-gray-100">
                      {recentRecords.map((record: any, index: number) => {
                        const user = typeof record.userId === 'object' ? record.userId : null;
                        const statusColor =
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'late'
                            ? 'bg-yellow-100 text-yellow-700'
                            : record.status === 'excused'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700';

                        return (
                          <div key={record._id || index} className="flex items-center space-x-3 py-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
                              {user?.firstName?.[0] || '?'}{user?.lastName?.[0] || ''}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(record.date || record.checkInTime).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric',
                                })}
                                {' · '}
                                {formatTime(record.checkInTime)}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${statusColor}`}>
                              {record.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {records.map((record: any, index: number) => {
                  const user =
                    typeof record.userId === 'object' ? record.userId : null;
                  const marker =
                    typeof record.markedBy === 'object' ? record.markedBy : null;
                  const statusColor =
                    record.status === 'present'
                      ? 'bg-green-100 text-green-700'
                      : record.status === 'late'
                      ? 'bg-yellow-100 text-yellow-700'
                      : record.status === 'excused'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700';

                  return (
                    <div key={record._id || index}>
                      {/* Desktop Row */}
                      <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors">
                        <div className="col-span-4 flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {user?.firstName?.[0] || '?'}
                            {user?.lastName?.[0] || ''}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user
                                ? `${user.firstName} ${user.lastName}`
                                : 'Unknown'}
                            </p>
                            {user?.email && (
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}
                          >
                            {record.status}
                          </span>
                          {record.isFirstTimeVisitor && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {formatTime(record.checkInTime)}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {record.checkOutTime
                            ? formatTime(record.checkOutTime)
                            : '--'}
                        </div>
                        <div className="col-span-2 text-sm text-gray-500 truncate">
                          {marker
                            ? `${marker.firstName} ${marker.lastName}`
                            : '--'}
                        </div>
                      </div>

                      {/* Mobile Card */}
                      <div className="md:hidden p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {user?.firstName?.[0] || '?'}
                            {user?.lastName?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user
                                  ? `${user.firstName} ${user.lastName}`
                                  : 'Unknown'}
                              </p>
                              <span
                                className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ml-2 ${statusColor}`}
                              >
                                {record.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                <ClockIcon className="w-3 h-3 mr-0.5" />
                                {formatTime(record.checkInTime)}
                              </span>
                              {record.isFirstTimeVisitor && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Page {page}/{totalPages} &middot; {totalRecords} records
                </p>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
