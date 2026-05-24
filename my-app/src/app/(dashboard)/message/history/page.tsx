'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emailService } from '@/services';
import type { Email } from '@/types';
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
  XMarkIcon,
  PaperClipIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 10;

type StatusKey = 'sent' | 'pending' | 'failed' | 'scheduled';
const statusConfig: Record<StatusKey, { label: string; pill: string; icon: any }> = {
  sent: { label: 'Sent', pill: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300', icon: CheckCircleIcon },
  pending: { label: 'Pending', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300', icon: ClockIcon },
  failed: { label: 'Failed', pill: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300', icon: XCircleIcon },
  scheduled: { label: 'Scheduled', pill: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300', icon: ClockIcon },
};

const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const fmtTime = (s?: string) => (s ? new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '');

const recipientSummary = (e: Email) => {
  const r = e.recipients || [];
  if (r.length === 0) return 'No recipients';
  if (r.length === 1) return r[0].email;
  return `${r[0].email} +${r.length - 1} more`;
};

export default function EmailHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Email | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emails', 'history', page],
    queryFn: () => emailService.getEmails(page, ITEMS_PER_PAGE),
  });

  const emails = data?.emails ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasActiveFilters = !!search || !!status;

  const filtered = useMemo(
    () =>
      emails.filter((e) => {
        if (status && e.status !== status) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            e.subject?.toLowerCase().includes(q) ||
            e.recipients?.some((r) => r.email.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    [emails, status, search]
  );

  const card = 'rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm';

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Email History</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{total} email{total === 1 ? '' : 's'} sent</p>
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`p-2 md:px-3 md:py-2 rounded-xl flex items-center gap-1.5 text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden md:inline">Filters</span>
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`${card} p-3`}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search subject or recipient..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button onClick={() => { setSearch(''); setStatus(''); setPage(1); }} className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 text-sm">Clear</button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 p-4 text-sm">
            Failed to load emails. Please try again.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.06] rounded-full flex items-center justify-center mb-3">
              <EnvelopeIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">No emails found</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{hasActiveFilters ? 'Try adjusting your filters' : 'Sent emails will appear here'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((email) => {
              const sc = statusConfig[email.status as StatusKey];
              const StatusIcon = sc?.icon || CheckCircleIcon;
              return (
                <button
                  key={email._id}
                  onClick={() => setSelected(email)}
                  className={`${card} w-full text-left p-3.5 flex items-center gap-3 hover:shadow-md transition-shadow`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{email.subject || 'No subject'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{recipientSummary(email)}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                    <span>{fmtDate(email.sentAt || email.createdAt)}</span>
                    <span>{fmtTime(email.sentAt || email.createdAt)}</span>
                  </div>
                  {email.attachments && email.attachments.length > 0 && (
                    <PaperClipIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium shrink-0 ${sc?.pill || 'bg-gray-100 text-gray-700'}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{sc?.label || email.status}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50">
                <ChevronLeftIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50">
                <ChevronRightIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#2c2c2e] ring-1 ring-black/10 dark:ring-white/10 shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-[#2c2c2e] px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">{selected.subject || 'No subject'}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmtDate(selected.sentAt || selected.createdAt)} · {fmtTime(selected.sentAt || selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/10 shrink-0">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const sc = statusConfig[selected.status as StatusKey];
                  const StatusIcon = sc?.icon || CheckCircleIcon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc?.pill || 'bg-gray-100 text-gray-700'}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {sc?.label || selected.status}
                    </span>
                  );
                })()}
                {selected.type && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 capitalize">{selected.type}</span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
                  <UsersIcon className="w-3.5 h-3.5" /> Recipients ({selected.recipients?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(selected.recipients || []).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-xs text-gray-700 dark:text-gray-300">{r.email}</span>
                  ))}
                </div>
              </div>

              {selected.attachments && selected.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
                    <PaperClipIcon className="w-3.5 h-3.5" /> Attachments
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.attachments.map((a, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-xs text-gray-700 dark:text-gray-300">{a.filename}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Message</p>
                <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {selected.body || '(no content)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
