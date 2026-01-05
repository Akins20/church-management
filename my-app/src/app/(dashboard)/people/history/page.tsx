'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services';
import {
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 8;

const statusConfig = {
  present: { label: 'Present', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700', icon: XCircleIcon },
  late: { label: 'Late', color: 'bg-amber-100 text-amber-700', icon: ExclamationCircleIcon },
  excused: { label: 'Excused', color: 'bg-blue-100 text-blue-700', icon: CheckCircleIcon },
};

export default function PeopleHistoryPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch attendance records
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'history', page, filters],
    queryFn: () =>
      attendanceService.getAttendance(
        {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          status: filters.status || undefined,
        },
        page,
        ITEMS_PER_PAGE
      ),
  });

  const attendance = data?.attendance || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', status: '' });
    setPage(1);
  };

  const exportToCSV = () => {
    if (!attendance.length) return;

    const headers = ['Date', 'Name', 'Email', 'Status', 'Check-in Time', 'Check-out Time'];
    const rows = attendance.map((record) => {
      const user = typeof record.userId === 'object' ? record.userId : null;
      return [
        formatDate(record.date),
        user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        user?.email || '',
        record.status,
        formatTime(record.checkInTime),
        record.checkOutTime ? formatTime(record.checkOutTime) : '',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.status;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">Attendance History</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">View and export past attendance records</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 md:px-3 md:py-2 rounded-xl flex items-center space-x-1.5 transition-colors text-xs md:text-sm ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span className="hidden md:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>
            <button
              onClick={exportToCSV}
              disabled={!attendance.length}
              className="p-2 md:px-3 md:py-2 bg-gray-900 text-white rounded-xl flex items-center space-x-1.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs md:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors text-xs md:text-sm whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Stats Bar */}
        <div className="px-4 md:px-6 py-2 md:py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">
              {attendance.length} of {total} records
            </span>
            <div className="hidden sm:flex items-center space-x-3">
              {Object.entries(statusConfig).map(([key, config]) => (
                <div key={key} className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-').split(' ')[0]}`} />
                  <span className="text-gray-600 text-[10px] md:text-xs">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table/Cards */}
        <div className="flex-1 p-4 md:p-6 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <UserGroupIcon className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No attendance records found</p>
              <p className="text-gray-400 text-xs mt-1">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Check-in some members to see history'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-2">
                {attendance.map((record) => {
                  const user = typeof record.userId === 'object' ? record.userId : null;
                  const status = statusConfig[record.status as keyof typeof statusConfig];
                  const StatusIcon = status?.icon || CheckCircleIcon;

                  return (
                    <div
                      key={record._id}
                      className="bg-white rounded-xl border border-gray-200 p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                            {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{user?.email || ''}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{status?.label || record.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{formatDate(record.date)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>In: {formatTime(record.checkInTime)}</span>
                          </div>
                          {record.checkOutTime && (
                            <div className="flex items-center space-x-1">
                              <span>Out: {formatTime(record.checkOutTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.map((record) => {
                      const user = typeof record.userId === 'object' ? record.userId : null;
                      const status = statusConfig[record.status as keyof typeof statusConfig];
                      const StatusIcon = status?.icon || CheckCircleIcon;

                      return (
                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500">{user?.email || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2 text-gray-700 text-sm">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(record.date)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2 text-gray-700 text-sm">
                              <ClockIcon className="w-4 h-4 text-gray-400" />
                              <span>{formatTime(record.checkInTime)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.checkOutTime ? (
                              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                <span>{formatTime(record.checkOutTime)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{status?.label || record.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 py-3 md:py-4 bg-white border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 md:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                </button>
                <div className="hidden sm:flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <span className="sm:hidden text-xs text-gray-600 px-2">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 md:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
