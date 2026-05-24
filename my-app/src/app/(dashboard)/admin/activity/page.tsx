'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { activityService } from '@/services';
import type { ActivityLogEntry, DigestConfig } from '@/services/activity.service';
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = ['auth', 'user', 'attendance', 'ministry', 'department', 'email', 'media', 'settings', 'other'];
const CATEGORY_STYLE: Record<string, string> = {
  auth: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  user: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  attendance: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ministry: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  department: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  email: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  media: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  settings: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
  other: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
};

const card = 'rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm';

const actorLabel = (e: ActivityLogEntry): string => {
  if (e.actor && typeof e.actor === 'object') {
    const a = e.actor;
    const name = `${a.firstName || ''} ${a.lastName || ''}`.trim();
    return name || a.email || 'Unknown';
  }
  return e.actorName || e.actorEmail || 'System';
};
const actorInitials = (label: string) =>
  label.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const fmt = (s: string) =>
  new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {
    category: category || undefined,
    action: action || undefined,
    search: debounced || undefined,
    startDate: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['activity', filters, page],
    queryFn: () => activityService.list(filters, page, 25),
    placeholderData: keepPreviousData,
  });

  const { data: actionList = [] } = useQuery({
    queryKey: ['activity', 'actions'],
    queryFn: () => activityService.actions(),
  });

  // --- Email digest config ---
  const queryClient = useQueryClient();
  const [showDigest, setShowDigest] = useState(false);
  const [digestMsg, setDigestMsg] = useState<string | null>(null);
  const [digestForm, setDigestForm] = useState<{
    enabled: boolean;
    frequency: DigestConfig['frequency'];
    cron: string;
    recipients: string;
  }>({ enabled: false, frequency: 'weekly', cron: '', recipients: '' });

  const { data: digest } = useQuery({
    queryKey: ['activity', 'digest'],
    queryFn: () => activityService.getDigest(),
  });
  useEffect(() => {
    if (digest) {
      setDigestForm({
        enabled: digest.enabled,
        frequency: digest.frequency,
        cron: digest.cron || '',
        recipients: (digest.recipients || []).join(', '),
      });
    }
  }, [digest]);

  const flash = (m: string) => { setDigestMsg(m); setTimeout(() => setDigestMsg(null), 2800); };
  const saveDigest = useMutation({
    mutationFn: () =>
      activityService.updateDigest({
        enabled: digestForm.enabled,
        frequency: digestForm.frequency,
        cron: digestForm.frequency === 'custom' ? digestForm.cron : undefined,
        recipients: digestForm.recipients.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activity', 'digest'] }); flash('Digest settings saved'); },
    onError: () => flash('Failed to save settings'),
  });
  const sendNow = useMutation({
    mutationFn: () => activityService.sendDigestNow(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activity', 'digest'] }); flash('Digest sent'); },
    onError: () => flash('Failed to send digest'),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const resetPageThen = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Activity Log</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{total} recorded {total === 1 ? 'event' : 'events'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDigest((s) => !s)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/[0.08] text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              <EnvelopeIcon className="w-4 h-4" />
              Digest
            </button>
            <button
              onClick={() => activityService.exportCsv(filters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Email digest config */}
        {showDigest && (
          <div className={`${card} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Email digest</h2>
              {digestMsg && <span className="text-xs text-emerald-600 dark:text-emerald-400">{digestMsg}</span>}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={digestForm.enabled}
                onChange={(e) => setDigestForm({ ...digestForm, enabled: e.target.checked })}
                className="rounded"
              />
              Email an activity digest automatically
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Frequency</label>
                <select
                  value={digestForm.frequency}
                  onChange={(e) => setDigestForm({ ...digestForm, frequency: e.target.value as DigestConfig['frequency'] })}
                  className="px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly (Mondays)</option>
                  <option value="monthly">Monthly (1st)</option>
                  <option value="custom">Custom (cron)</option>
                </select>
              </div>
              {digestForm.frequency === 'custom' && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Cron expression</label>
                  <input
                    value={digestForm.cron}
                    onChange={(e) => setDigestForm({ ...digestForm, cron: e.target.value })}
                    placeholder="0 8 * * 1"
                    className="px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Recipients (comma-separated, blank = admin email)</label>
                <input
                  value={digestForm.recipients}
                  onChange={(e) => setDigestForm({ ...digestForm, recipients: e.target.value })}
                  placeholder="admin@church.org, pastor@church.org"
                  className="w-full px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => saveDigest.mutate()}
                disabled={saveDigest.isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saveDigest.isPending ? 'Saving…' : 'Save settings'}
              </button>
              <button
                onClick={() => sendNow.mutate()}
                disabled={sendNow.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/[0.08] text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {sendNow.isPending ? 'Sending…' : 'Send now'}
              </button>
              {digest?.lastSentAt && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  Last sent {new Date(digest.lastSentAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`${card} p-3 flex flex-wrap items-end gap-2.5`}>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => resetPageThen(() => setSearch(e.target.value))}
                placeholder="Description, actor, action…"
                className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-32">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
            <select value={category} onChange={(e) => resetPageThen(() => setCategory(e.target.value))}
              className="w-full px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Action</label>
            <select value={action} onChange={(e) => resetPageThen(() => setAction(e.target.value))}
              className="w-full px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              {actionList.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input type="date" value={startDate} max={endDate || undefined} onChange={(e) => resetPageThen(() => setStartDate(e.target.value))}
              className="px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => resetPageThen(() => setEndDate(e.target.value))}
              className="px-2.5 py-2 bg-gray-100 dark:bg-white/[0.06] border border-transparent rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {(category || action || startDate || endDate || search) && (
            <button
              onClick={() => resetPageThen(() => { setSearch(''); setCategory(''); setAction(''); setStartDate(''); setEndDate(''); })}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 p-4 text-sm">
            Failed to load activity. Please try again.
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">No activity found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <div className={`${card} divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden`}>
            {logs.map((e) => {
              const label = actorLabel(e);
              return (
                <div key={e._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
                    {actorInitials(label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{e.description}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {label} · {fmt(e.createdAt)}{e.ip ? ` · ${e.ip}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 capitalize ${CATEGORY_STYLE[e.category] || CATEGORY_STYLE.other}`}>
                    {e.category}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50">
                <ChevronLeftIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50">
                <ChevronRightIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
