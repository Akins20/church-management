'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserRole } from '@/store/slices/authSlice';
import { attendanceService, serviceService, noteService, userService, ministryService } from '@/services';
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

  const adminStats = [
    { name: "Today's Check-ins", value: todayCount, icon: ClipboardDocumentCheckIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Total Members', value: totalMembers, icon: UserGroupIcon, color: 'from-green-500 to-green-600' },
    { name: 'Avg Attendance', value: avgAttendance, icon: ArrowTrendingUpIcon, color: 'from-purple-500 to-purple-600' },
    { name: 'Active Ministries', value: totalMinistries, icon: BuildingOffice2Icon, color: 'from-orange-500 to-orange-600' },
  ];

  const memberStats = [
    { name: 'Attendance Rate', value: `${attendanceRate}%`, icon: ChartBarIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Services Attended', value: attendanceList.filter(a => a.status === 'present').length, icon: CheckCircleIcon, color: 'from-green-500 to-green-600' },
    { name: 'Ministries', value: totalMinistries, icon: UserGroupIcon, color: 'from-purple-500 to-purple-600' },
    { name: 'Total Services', value: (attendanceAnalytics?.summary as any)?.totalServices || attendanceAnalytics?.summary?.totalDays || attendanceList.length || 0, icon: CalendarIcon, color: 'from-orange-500 to-orange-600' },
  ];

  const stats = isStaffOrAdmin ? adminStats : memberStats;

  const quickActions = isStaffOrAdmin ? [
    { name: 'Check-in', description: 'Register attendance', href: '/people/checkin', icon: ClipboardDocumentCheckIcon, color: 'bg-blue-500' },
    { name: 'Send Email', description: 'Message groups', href: '/message/email', icon: EnvelopeIcon, color: 'bg-purple-500' },
    { name: 'New Note', description: 'Create a note', href: '/notepad/notes', icon: PencilSquareIcon, color: 'bg-orange-500' },
    { name: 'Ministries', description: 'Manage ministries', href: '/ministries', icon: BuildingOffice2Icon, color: 'bg-green-500' },
  ] : [
    { name: 'Profile', description: 'Update your profile', href: '/profile', icon: UserGroupIcon, color: 'bg-blue-500' },
    { name: 'Ministries', description: 'Browse ministries', href: '/ministries', icon: BuildingOffice2Icon, color: 'bg-purple-500' },
    { name: 'Services', description: 'View services', href: '/services', icon: CalendarIcon, color: 'bg-green-500' },
    { name: 'Sermons', description: 'Browse sermons', href: '/sermons', icon: DocumentTextIcon, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-6 py-4 md:py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">Welcome, {user?.firstName || 'User'}!</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-0.5 hidden sm:block">
              {isStaffOrAdmin ? 'Manage your church operations from here' : "Here's what's happening at church"}
            </p>
          </div>
          <div className="text-right text-blue-100 text-xs md:text-sm">
            <p className="font-medium text-white">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="hidden sm:block">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-4 min-h-0 overflow-y-auto">
        <div className="h-full flex flex-col space-y-4 md:space-y-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 shrink-0">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="bg-white rounded-xl md:rounded-xl border border-gray-200 p-3 md:p-4 flex items-center space-x-3 md:space-x-4">
                  <div className={`bg-gradient-to-br ${stat.color} p-2 md:p-3 rounded-lg md:rounded-xl`}>
                    <Icon className="w-4 md:w-5 h-4 md:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-500 truncate">{stat.name}</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-3 min-h-0">
            {/* Quick Actions */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white rounded-xl md:rounded-xl border border-gray-200 flex-1 flex flex-col">
                <div className="p-3 md:p-4 border-b border-gray-200 shrink-0">
                  <h2 className="font-semibold text-gray-900 text-sm md:text-base">Quick Actions</h2>
                </div>
                <div className="p-3 md:p-4 flex-1">
                  <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 md:gap-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.name}
                          href={action.href}
                          className="flex flex-col items-center p-2 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center"
                        >
                          <div className={`${action.color} p-2 md:p-2.5 rounded-lg md:rounded-xl mb-1 md:mb-2`}>
                            <Icon className="w-4 md:w-5 h-4 md:h-5 text-white" />
                          </div>
                          <span className="text-xs md:text-sm font-medium text-gray-900">{action.name}</span>
                          <span className="text-[8px] md:text-[10px] text-gray-500 hidden md:block">{action.description}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Recent Note */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white rounded-xl md:rounded-xl border border-gray-200 flex-1 flex flex-col">
                <div className="p-3 md:p-4 border-b border-gray-200 shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 text-sm md:text-base">Recent Note</h2>
                    <Link
                      href="/notepad/notes"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col">
                  {notesList.length > 0 ? (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-blue-100 px-2.5 py-1 rounded-full">
                            <span className="text-blue-700 text-xs font-medium">Latest</span>
                          </div>
                          <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {notesList[0]?.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                          {notesList[0]?.content?.substring(0, 120) || 'No content'}
                        </p>
                        <div className="mt-4 flex items-center text-sm text-blue-600">
                          <ClockIcon className="w-4 h-4 mr-1.5" />
                          <span>{new Date(notesList[0]?.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <Link
                        href="/notepad/notes"
                        className="mt-3 block w-full text-center py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors text-sm"
                      >
                        Open Notes
                      </Link>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <DocumentTextIcon className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No notes yet</p>
                      <p className="text-gray-400 text-xs mt-1">Create your first note</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Recent Attendance */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white rounded-xl md:rounded-xl border border-gray-200 flex-1 flex flex-col">
                <div className="p-3 md:p-4 border-b border-gray-200 shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 text-sm md:text-base">Recent Attendance</h2>
                    <Link
                      href="/people/history"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="p-3 md:p-4 flex-1 min-h-0">
                  {(todayAttendance || []).length > 0 ? (
                    <div className="space-y-2">
                      {(todayAttendance || []).slice(0, 4).map((record: any, index: number) => {
                        const attendee = typeof record.userId === 'object' ? record.userId : null;
                        return (
                          <div
                            key={record._id || index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-green-100">
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Member'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(record.checkInTime || record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
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
                        return (
                          <div
                            key={attendance._id || index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                attendance.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {attendance.status === 'present' ? (
                                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ClockIcon className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {attendee ? `${attendee.firstName} ${attendee.lastName}` : serviceName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(attendance.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              attendance.status === 'present'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {attendance.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                      <ClockIcon className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No attendance records</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
