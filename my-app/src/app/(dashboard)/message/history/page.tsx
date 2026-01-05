'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emailService } from '@/services';
import {
  EnvelopeIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  SENT: { label: 'Sent', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: ClockIcon },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircleIcon },
  DELIVERED: { label: 'Delivered', color: 'bg-blue-100 text-blue-700', icon: CheckCircleIcon },
};

export default function EmailHistoryPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['emails', 'history', page, filters],
    queryFn: () => emailService.getEmails(page, ITEMS_PER_PAGE),
  });

  const emails = data?.data || [];
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
    setFilters({ search: '', status: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.status;

  // Filter emails client-side for now
  const filteredEmails = emails.filter((email) => {
    if (filters.status && email.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        email.subject?.toLowerCase().includes(searchLower) ||
        email.to?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">Email History</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">View all sent emails and their delivery status</p>
          </div>
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
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search subject or recipient..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs md:text-sm"
                >
                  <option value="">All</option>
                  <option value="SENT">Sent</option>
                  <option value="PENDING">Pending</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
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
              {filteredEmails.length} of {total} emails
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
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <EnvelopeIcon className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No emails found</p>
              <p className="text-gray-400 text-xs mt-1">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Send some emails to see them here'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-2">
                {filteredEmails.map((email) => {
                  const status = statusConfig[email.status as keyof typeof statusConfig];
                  const StatusIcon = status?.icon || CheckCircleIcon;

                  return (
                    <div
                      key={email.id}
                      className="bg-white rounded-xl border border-gray-200 p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                            <EnvelopeIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {email.subject || 'No Subject'}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{email.to}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-2 ${
                            status?.color || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{status?.label || email.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{formatDate(email.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatTime(email.createdAt)}</span>
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
                        Subject
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEmails.map((email) => {
                      const status = statusConfig[email.status as keyof typeof statusConfig];
                      const StatusIcon = status?.icon || CheckCircleIcon;

                      return (
                        <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                                <EnvelopeIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate max-w-xs">
                                  {email.subject || 'No Subject'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-700 truncate max-w-xs">{email.to}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="flex items-center space-x-2 text-gray-700">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                <span>{formatDate(email.createdAt)}</span>
                              </div>
                              <p className="text-xs text-gray-500 ml-6">{formatTime(email.createdAt)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                status?.color || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{status?.label || email.status}</span>
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
