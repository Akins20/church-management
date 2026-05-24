'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services';
import type {
  AttendanceGroupBucket,
  AttendanceGroupKey,
} from '@/services/attendance.service';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

type Preset = 'today' | 'thisSunday' | 'lastSunday' | 'week' | 'month' | 'custom';

const GROUP_ORDER: AttendanceGroupKey[] = ['men', 'women', 'youth', 'teenagers', 'children'];
const GROUP_META: Record<AttendanceGroupKey, { label: string; badge: string; avatar: string }> = {
  men: { label: 'Men', badge: 'from-blue-500 to-indigo-600', avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  women: { label: 'Women', badge: 'from-rose-500 to-pink-600', avatar: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  youth: { label: 'Youth', badge: 'from-violet-500 to-purple-600', avatar: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' },
  teenagers: { label: 'Teenagers', badge: 'from-amber-500 to-orange-600', avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  children: { label: 'Children', badge: 'from-emerald-500 to-green-600', avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
};

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const mostRecentSunday = (ref: Date = new Date()) => { const d = new Date(ref); d.setDate(d.getDate() - d.getDay()); return startOfDay(d); };
const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const card = 'rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm';

export function GroupBreakdown({ backHref = '/dashboard' }: { backHref?: string }) {
  const [preset, setPreset] = useState<Preset>('thisSunday');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const today = new Date();
    let s: Date | null = null;
    let e: Date | null = null;
    let label = '';
    if (preset === 'today') { s = startOfDay(today); e = endOfDay(today); label = 'Today'; }
    else if (preset === 'thisSunday') { s = mostRecentSunday(today); e = endOfDay(s); label = `Sunday, ${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`; }
    else if (preset === 'lastSunday') { const t = mostRecentSunday(today); s = new Date(t); s.setDate(s.getDate() - 7); e = endOfDay(s); label = `Sunday, ${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`; }
    else if (preset === 'week') { e = endOfDay(today); s = startOfDay(new Date(today)); s.setDate(today.getDate() - 7); label = 'Last 7 days'; }
    else if (preset === 'month') { e = endOfDay(today); s = startOfDay(new Date(today)); s.setDate(today.getDate() - 30); label = 'Last 30 days'; }
    else if (preset === 'custom') { s = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : null; e = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : null; label = customStart || customEnd ? `${customStart || '…'} → ${customEnd || '…'}` : 'Custom range'; }
    return { rangeStart: s, rangeEnd: e, rangeLabel: label };
  }, [preset, customStart, customEnd]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendanceByGroup', rangeStart?.toISOString(), rangeEnd?.toISOString()],
    queryFn: () =>
      attendanceService.getAttendanceByGroup(
        rangeStart ? rangeStart.toISOString() : undefined,
        rangeEnd ? rangeEnd.toISOString() : undefined
      ),
    enabled: !!rangeStart && !!rangeEnd,
  });

  const bucketByKey = new Map<string, AttendanceGroupBucket>();
  for (const g of data?.groups || []) bucketByKey.set(g.group, g);
  const orderedGroups: AttendanceGroupBucket[] = GROUP_ORDER.map(
    (key) => bucketByKey.get(key) || { group: key, label: GROUP_META[key].label, count: 0, attendees: [] }
  );
  const ungrouped = data?.ungrouped;
  const totalUnique = data?.totalAttendees || 0;

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const presetButton = (id: Preset, label: string) => (
    <button
      key={id}
      onClick={() => setPreset(id)}
      className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-colors ${
        preset === id
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const renderAttendees = (attendees: AttendanceGroupBucket['attendees'], avatarClass: string) =>
    attendees.length === 0 ? (
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">No attendees</p>
    ) : (
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attendees.map((a) => (
          <li key={a._id} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/[0.04] rounded-lg border border-gray-100 dark:border-white/[0.06]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${avatarClass}`}>
              {a.firstName?.[0]}{a.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{a.firstName} {a.lastName}</p>
              {a.email && <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{a.email}</p>}
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Attendance History</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Breakdown by group</p>
          </div>
          <Link href={backHref} className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back
          </Link>
        </div>

        {/* Filters */}
        <div className={`${card} p-3 space-y-3`}>
          <div className="flex flex-wrap items-center gap-2">
            {presetButton('today', 'Today')}
            {presetButton('thisSunday', 'This Sunday')}
            {presetButton('lastSunday', 'Last Sunday')}
            {presetButton('week', 'Last 7 days')}
            {presetButton('month', 'Last 30 days')}
            {presetButton('custom', 'Custom range')}
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              {rangeLabel}
            </span>
          </div>
          {preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">From</label>
                <input type="date" value={customStart} max={customEnd || toInputDate(new Date())} onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 dark:bg-white/[0.04] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">To</label>
                <input type="date" value={customEnd} min={customStart || undefined} max={toInputDate(new Date())} onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 dark:bg-white/[0.04] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100" />
              </div>
              {(customStart || customEnd) && (
                <button onClick={() => { setCustomStart(''); setCustomEnd(''); }} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 underline">Clear</button>
              )}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 md:px-5 py-3 flex items-center gap-3">
          <UsersIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Total who attended</span>
          <span className="text-xl font-bold ml-1">{totalUnique}</span>
          <span className="text-xs text-blue-100 ml-auto hidden md:block">{rangeLabel}</span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 p-4 text-sm">
            Failed to load attendance data. Please try again.
          </div>
        ) : (
          <div className="space-y-3">
            {/* At-a-glance */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              {orderedGroups.map((g) => {
                const meta = GROUP_META[g.group as AttendanceGroupKey];
                return (
                  <div key={`stat-${g.group}`} className={`${card} p-3 text-center`}>
                    <div className={`mx-auto mb-1 w-9 h-9 rounded-xl bg-gradient-to-br ${meta.badge} text-white flex items-center justify-center text-sm font-bold`}>
                      {g.count}
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{meta.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Expandable cards */}
            {orderedGroups.map((g) => {
              const meta = GROUP_META[g.group as AttendanceGroupKey];
              const open = !!expanded[g.group];
              return (
                <div key={g.group} className={`${card} overflow-hidden`}>
                  <button onClick={() => toggle(g.group)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.badge} text-white flex items-center justify-center font-bold shrink-0`}>{g.count}</div>
                      <p className="font-semibold text-gray-900 dark:text-white text-left">{meta.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{g.count === 1 ? '1 attendee' : `${g.count} attendees`}</span>
                      {open ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-3 bg-gray-50 dark:bg-white/[0.02]">
                      {renderAttendees(g.attendees, meta.avatar)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped */}
            {ungrouped && ungrouped.count > 0 && (
              <div className="rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-amber-200 dark:ring-amber-500/20 overflow-hidden">
                <button onClick={() => toggle('__ungrouped__')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">{ungrouped.count}</div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">No group recorded</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Attended but no group selected at check-in</p>
                    </div>
                  </div>
                  {expanded['__ungrouped__'] ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </button>
                {expanded['__ungrouped__'] && (
                  <div className="border-t border-amber-100 dark:border-amber-500/20 px-4 py-3 bg-amber-50 dark:bg-amber-500/5">
                    {renderAttendees(ungrouped.attendees, 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300')}
                  </div>
                )}
              </div>
            )}

            {totalUnique === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">No attendance in this range</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different date filter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
