'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserRole } from '@/store/slices/authSlice';
import { attendanceService, serviceService, noteService, ministryService } from '@/services';
import {
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { UserRole } from '@/types';

const roleMatches = (userRole: string | UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  const normalizedUserRole = String(userRole).toLowerCase();
  return allowedRoles.some(role => String(role).toLowerCase() === normalizedUserRole);
};

export default function MemberDashboard() {
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);
  const isStaffOrAdmin = roleMatches(userRole, [UserRole.STAFF, UserRole.ADMIN]);

  const { data: currentService } = useQuery({
    queryKey: ['currentService'],
    queryFn: serviceService.getCurrentService,
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: attendanceService.getTodayAttendance,
  });

  const { data: recentNotes } = useQuery({
    queryKey: ['recentNotes'],
    queryFn: () => noteService.getNotes({}, 1, 4),
  });

  const userId = (user as any)?._id || (user as any)?.id || '';
  const { data: userAttendance } = useQuery({
    queryKey: ['userAttendance', userId],
    queryFn: () => attendanceService.getUserAttendance(userId),
    enabled: !!userId && !isStaffOrAdmin,
  });

  // Fetch total members count (staff/admin only - endpoint requires elevated role)
  const { data: usersData } = useQuery({
    queryKey: ['usersStats'],
    queryFn: () => userService.getUsers({}, 1, 1),
    enabled: isStaffOrAdmin,
  });

  // Fetch ministries count
  const { data: ministriesData } = useQuery({
    queryKey: ['ministriesStats'],
    queryFn: () => ministryService.getMinistries(1, 1),
  });

  // Fetch attendance analytics
  const { data: attendanceAnalytics } = useQuery({
    queryKey: ['attendanceAnalytics'],
    queryFn: () => attendanceService.getAttendanceAnalytics(),
  });

  const attendanceList = Array.isArray(userAttendance) ? userAttendance : [];
  const attendanceRate = attendanceList.length > 0
    ? Math.round((attendanceList.filter(a => a.status === 'present').length / attendanceList.length) * 100)
    : 0;

  const todayCount = todayAttendance?.length || 0;
  const notesList = recentNotes?.notes || [];
  const totalMembers = usersData?.total || (usersData as any)?.data?.total || 0;
  const totalMinistries = ministriesData?.total || ministriesData?.data?.length || 0;
  const avgAttendance = attendanceAnalytics?.summary?.avgAttendancePerDay
    ? Math.round(attendanceAnalytics.summary.avgAttendancePerDay)
    : 0;

  // Attendance for the most recent service:
  // prefer today's count if anyone's checked in; otherwise fall back to the last day with attendance in the trend
  const trend = attendanceAnalytics?.trendByDate || [];
  const lastTrendEntry = trend.length > 0 ? trend[trend.length - 1] : null;
  const lastServiceAttendance = todayCount > 0
    ? todayCount
    : (lastTrendEntry?.count || 0);
  const lastServiceDateLabel = todayCount > 0
    ? 'today'
    : (lastTrendEntry?._id
        ? new Date(lastTrendEntry._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—');

  const adminStats = [
    { name: "Today's Check-ins", value: todayCount, icon: ClipboardDocumentCheckIcon, tint: 'bg-blue-500/10', fg: 'text-blue-600' },
    { name: `Last Service (${lastServiceDateLabel})`, value: lastServiceAttendance, icon: UserGroupIcon, tint: 'bg-emerald-500/10', fg: 'text-emerald-600' },
    { name: 'Avg Attendance', value: avgAttendance, icon: ArrowTrendingUpIcon, tint: 'bg-violet-500/10', fg: 'text-violet-600' },
    { name: 'Active Ministries', value: totalMinistries, icon: BuildingOffice2Icon, tint: 'bg-amber-500/10', fg: 'text-amber-600' },
  ];

  const memberStats = [
    { name: 'Attendance Rate', value: `${attendanceRate}%`, icon: ChartBarIcon, tint: 'bg-blue-500/10', fg: 'text-blue-600' },
    { name: 'Services Attended', value: attendanceList.filter(a => a.status === 'present').length, icon: CheckCircleIcon, tint: 'bg-emerald-500/10', fg: 'text-emerald-600' },
    { name: 'Ministries', value: totalMinistries, icon: UserGroupIcon, tint: 'bg-violet-500/10', fg: 'text-violet-600' },
    { name: 'Total Services', value: (attendanceAnalytics?.summary as any)?.totalServices || attendanceAnalytics?.summary?.totalDays || attendanceList.length || 0, icon: CalendarIcon, tint: 'bg-amber-500/10', fg: 'text-amber-600' },
  ];

  const stats = isStaffOrAdmin ? adminStats : memberStats;

  const quickActions = isStaffOrAdmin ? [
    { name: 'Check-in', description: 'Register attendance', href: '/people/checkin', icon: ClipboardDocumentCheckIcon, tint: 'bg-blue-500/10', fg: 'text-blue-600' },
    { name: 'Send Email', description: 'Message groups', href: '/message/email', icon: EnvelopeIcon, tint: 'bg-violet-500/10', fg: 'text-violet-600' },
    { name: 'New Note', description: 'Create a note', href: '/notepad/notes', icon: PencilSquareIcon, tint: 'bg-amber-500/10', fg: 'text-amber-600' },
    { name: 'Ministries', description: 'Manage ministries', href: '/ministries', icon: BuildingOffice2Icon, tint: 'bg-emerald-500/10', fg: 'text-emerald-600' },
  ] : [
    { name: 'Profile', description: 'Update your profile', href: '/profile', icon: UserGroupIcon, tint: 'bg-blue-500/10', fg: 'text-blue-600' },
    { name: 'Ministries', description: 'Browse ministries', href: '/ministries', icon: BuildingOffice2Icon, tint: 'bg-violet-500/10', fg: 'text-violet-600' },
    { name: 'Services', description: 'View services', href: '/services', icon: CalendarIcon, tint: 'bg-emerald-500/10', fg: 'text-emerald-600' },
    { name: 'Sermons', description: 'Browse sermons', href: '/sermons', icon: DocumentTextIcon, tint: 'bg-amber-500/10', fg: 'text-amber-600' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{todayLabel}</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {greeting}{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {isStaffOrAdmin ? 'Church operations overview' : "Here's what's happening at church"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm p-4 md:p-5">
                <div className={`w-11 h-11 rounded-2xl ${stat.tint} ${stat.fg} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5 truncate">{stat.name}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex flex-col items-start gap-2.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${action.tint} ${action.fg} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{action.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Note */}
          <div className="rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Note</h2>
              <Link href="/notepad/notes" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>
            {notesList.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="rounded-2xl p-4 bg-gray-50 dark:bg-white/[0.04] flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
                      Latest
                    </span>
                    <DocumentTextIcon className="w-5 h-5 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">
                    {notesList[0]?.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 line-clamp-3">
                    {notesList[0]?.content?.substring(0, 120) || 'No content'}
                  </p>
                  <div className="mt-4 flex items-center text-xs text-gray-400 dark:text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-1.5" />
                    <span>{new Date(notesList[0]?.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <Link
                  href="/notepad/notes"
                  className="mt-3 block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm"
                >
                  Open Notes
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.06] rounded-full flex items-center justify-center mb-3">
                  <DocumentTextIcon className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">No notes yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Create your first note</p>
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/[0.08] shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Attendance</h2>
              <Link href="/people/history" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>
            <div className="flex-1 min-h-0">
              {(todayAttendance || []).length > 0 ? (
                <div className="space-y-2">
                  {(todayAttendance || []).slice(0, 4).map((record: any, index: number) => {
                    const attendee = typeof record.userId === 'object' ? record.userId : null;
                    return (
                      <div key={record._id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.04] rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircleIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Member'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(record.checkInTime || record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                          Present
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : attendanceList.length > 0 ? (
                <div className="space-y-2">
                  {attendanceList.slice(0, 4).map((attendance: any, index: number) => {
                    const attendee = typeof attendance.userId === 'object' ? attendance.userId : null;
                    const serviceName = attendance.serviceId?.theme || attendance.notes || 'Church Service';
                    const present = attendance.status === 'present';
                    return (
                      <div key={attendance._id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.04] rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${present ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                            {present ? <CheckCircleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attendee ? `${attendee.firstName} ${attendee.lastName}` : serviceName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(attendance.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${present ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {attendance.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <ClockIcon className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">No attendance records</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
