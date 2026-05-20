'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { noteService } from '@/services';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type Preset = 'all' | 'week' | 'month' | 'lastMonth' | 'custom';

const ITEMS_PER_PAGE = 12;

// ISO yyyy-mm-dd helpers (local time)
const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfDayISO = (s: string) => new Date(`${s}T00:00:00`).toISOString();
const endOfDayISO = (s: string) => new Date(`${s}T23:59:59.999`).toISOString();

export default function NotepadHistoryPage() {
  const [preset, setPreset] = useState<Preset>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Resolve the active date range based on preset
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const today = new Date();
    let s: Date | null = null;
    let e: Date | null = today;
    let label = '';

    if (preset === 'all') {
      s = null;
      e = null;
      label = 'All time';
    } else if (preset === 'week') {
      s = new Date(today);
      s.setDate(today.getDate() - 7);
      label = 'Last 7 days';
    } else if (preset === 'month') {
      s = new Date(today);
      s.setDate(today.getDate() - 30);
      label = 'Last 30 days';
    } else if (preset === 'lastMonth') {
      s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      e = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      label = 'Last month';
    } else if (preset === 'custom') {
      s = customStart ? new Date(`${customStart}T00:00:00`) : null;
      e = customEnd ? new Date(`${customEnd}T23:59:59.999`) : null;
      label = customStart || customEnd
        ? `${customStart || '…'} → ${customEnd || '…'}`
        : 'Custom range';
    }
    return { rangeStart: s, rangeEnd: e, rangeLabel: label };
  }, [preset, customStart, customEnd]);

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (rangeStart) f.startDate = rangeStart.toISOString();
    if (rangeEnd) f.endDate = rangeEnd.toISOString();
    if (search.trim()) f.search = search.trim();
    return f;
  }, [rangeStart, rangeEnd, search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes', 'history', filters, page],
    queryFn: () => noteService.getNotes(filters as any, page, ITEMS_PER_PAGE),
  });

  const notes = data?.notes || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const presetButton = (id: Preset, label: string) => (
    <button
      key={id}
      onClick={() => {
        setPreset(id);
        setPage(1);
      }}
      className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-colors ${
        preset === id
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notes History</h1>
            <p className="text-gray-500 text-sm mt-0.5">Browse your past notes by date</p>
          </div>
          <Link
            href="/notepad/notes"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Notes
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {presetButton('week', 'Last 7 days')}
          {presetButton('month', 'Last 30 days')}
          {presetButton('lastMonth', 'Last month')}
          {presetButton('custom', 'Custom range')}
          {presetButton('all', 'All time')}
          <span className="ml-auto text-xs text-gray-500 hidden sm:inline">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            {rangeLabel}
          </span>
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">From</label>
              <input
                type="date"
                value={customStart}
                max={customEnd || toInputDate(new Date())}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs md:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">To</label>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                max={toInputDate(new Date())}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs md:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            {(customStart || customEnd) && (
              <button
                onClick={() => {
                  setCustomStart('');
                  setCustomEnd('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            Failed to load notes. Please try again.
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No notes in this range</p>
            <p className="text-gray-400 text-sm mt-1">Try a different date filter or search term</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {total} {total === 1 ? 'note' : 'notes'} — {rangeLabel}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {notes.map((note) => (
                <Link
                  key={note._id}
                  href={`/notepad/notes?id=${note._id}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                      {note.title || 'Untitled'}
                    </h3>
                    {note.isPinned && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3 flex-1">
                    {note.content || 'No content'}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {note.tags?.length > 0 && (
                      <span className="truncate ml-2">#{note.tags.slice(0, 2).join(', #')}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                </button>
                <span className="px-3 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
