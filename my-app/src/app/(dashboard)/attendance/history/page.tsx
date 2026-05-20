'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services';
import type { MinistryAttendanceGroup } from '@/services/attendance.service';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

type Preset = 'today' | 'thisSunday' | 'lastSunday' | 'week' | 'month' | 'custom';

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const mostRecentSunday = (ref: Date = new Date()) => {
  const d = new Date(ref);
  d.setDate(d.getDate() - d.getDay());
  return startOfDay(d);
};
const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function AttendanceHistoryPage() {
  const [preset, setPreset] = useState<Preset>('thisSunday');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const today = new Date();
    let s: Date | null = null;
    let e: Date | null = null;
    let label = '';

    if (preset === 'today') {
      s = startOfDay(today);
      e = endOfDay(today);
      label = 'Today';
    } else if (preset === 'thisSunday') {
      s = mostRecentSunday(today);
      e = endOfDay(s);
      label = `Sunday, ${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === 'lastSunday') {
      const thisSun = mostRecentSunday(today);
      s = new Date(thisSun);
      s.setDate(s.getDate() - 7);
      e = endOfDay(s);
      label = `Sunday, ${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (preset === 'week') {
      e = endOfDay(today);
      s = startOfDay(new Date(today));
      s.setDate(today.getDate() - 7);
      label = 'Last 7 days';
    } else if (preset === 'month') {
      e = endOfDay(today);
      s = startOfDay(new Date(today));
      s.setDate(today.getDate() - 30);
      label = 'Last 30 days';
    } else if (preset === 'custom') {
      s = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : null;
      e = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : null;
      label = customStart || customEnd ? `${customStart || '…'} → ${customEnd || '…'}` : 'Custom range';
    }
    return { rangeStart: s, rangeEnd: e, rangeLabel: label };
  }, [preset, customStart, customEnd]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'attendanceByMinistry',
      rangeStart?.toISOString(),
      rangeEnd?.toISOString(),
    ],
    queryFn: () =>
      attendanceService.getAttendanceByMinistry(
        rangeStart ? rangeStart.toISOString() : undefined,
        rangeEnd ? rangeEnd.toISOString() : undefined
      ),
    enabled: !!rangeStart && !!rangeEnd,
  });

  const groups: MinistryAttendanceGroup[] = data?.groups || [];
  // Sort by count desc, then name
  const sortedGroups = [...groups].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
  const unassigned = data?.unassigned;
  const totalUnique = data?.totalAttendees || 0;

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const presetButton = (id: Preset, label: string) => (
    <button
      key={id}
      onClick={() => setPreset(id)}
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Attendance History</h1>
            <p className="text-gray-500 text-sm mt-0.5">Attendance breakdown by ministry</p>
          </div>
          <Link
            href="/attendance"
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Attendance
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {presetButton('today', 'Today')}
          {presetButton('thisSunday', 'This Sunday')}
          {presetButton('lastSunday', 'Last Sunday')}
          {presetButton('week', 'Last 7 days')}
          {presetButton('month', 'Last 30 days')}
          {presetButton('custom', 'Custom range')}
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
                onChange={(e) => setCustomStart(e.target.value)}
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
                onChange={(e) => setCustomEnd(e.target.value)}
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
      </div>

      {/* Summary band */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 md:px-6 py-3 shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Total unique attendees</span>
            <span className="text-xl font-bold ml-1">{totalUnique}</span>
          </div>
          <div className="text-xs text-blue-100 ml-auto hidden md:block">{rangeLabel}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            Failed to load attendance data. Please try again.
          </div>
        ) : sortedGroups.length === 0 && !unassigned?.count ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No attendance in this range</p>
            <p className="text-gray-400 text-sm mt-1">Try a different date filter</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {sortedGroups.map((g) => {
              const open = !!expanded[g.ministryId];
              return (
                <div
                  key={g.ministryId}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggle(g.ministryId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                        {g.count}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                        {g.category && (
                          <p className="text-xs text-gray-500 capitalize">{g.category}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {g.count === 1 ? '1 attendee' : `${g.count} attendees`}
                      </span>
                      {open ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                      {g.attendees.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No attendees</p>
                      ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {g.attendees.map((a) => (
                            <li
                              key={a._id}
                              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                                {a.firstName?.[0]}
                                {a.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">
                                  {a.firstName} {a.lastName}
                                </p>
                                {a.email && (
                                  <p className="text-[11px] text-gray-500 truncate">{a.email}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned attendees (people with no ministry) */}
            {unassigned && unassigned.count > 0 && (
              <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle('__unassigned__')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      {unassigned.count}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">No ministry assigned</p>
                      <p className="text-xs text-amber-700">Attendees not yet linked to any ministry</p>
                    </div>
                  </div>
                  {expanded['__unassigned__'] ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expanded['__unassigned__'] && (
                  <div className="border-t border-amber-100 px-4 py-3 bg-amber-50">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {unassigned.attendees.map((a) => (
                        <li
                          key={a._id}
                          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-amber-100"
                        >
                          <div className="w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                            {a.firstName?.[0]}
                            {a.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {a.firstName} {a.lastName}
                            </p>
                            {a.email && (
                              <p className="text-[11px] text-gray-500 truncate">{a.email}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
