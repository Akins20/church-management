'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, userService, serviceService } from '@/services';
import { Card, Button, Input, Loading } from '@/components/common';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  QrCodeIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

export default function CheckInPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [checkedInMembers, setCheckedInMembers] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const { data: currentService, isLoading: serviceLoading } = useQuery({
    queryKey: ['currentService'],
    queryFn: serviceService.getCurrentService,
  });

  const { data: upcomingServices } = useQuery({
    queryKey: ['upcomingServices'],
    queryFn: serviceService.getUpcomingServices,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', search],
    queryFn: () => userService.getUsers({ search: search || undefined }, 1, 50),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (data: { userId: string; serviceId: string }) =>
      attendanceService.markAttendance(data),
    onSuccess: (_, variables) => {
      setCheckedInMembers((prev) => new Set([...prev, variables.userId]));
      setShowSuccess(variables.userId);
      setTimeout(() => setShowSuccess(null), 2000);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const handleCheckIn = (userId: string) => {
    const serviceId = selectedService || currentService?.id;
    if (!serviceId) {
      alert('Please select a service first');
      return;
    }

    markAttendanceMutation.mutate({
      userId,
      serviceId,
    });
  };

  const isLoading = serviceLoading || membersLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading check-in system..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Check-In</h1>
          <p className="text-gray-600">Mark attendance for today&apos;s service</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <QrCodeIcon className="h-5 w-5 mr-2" />
            QR Scanner
          </Button>
          <Button variant="outline">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Visitor
          </Button>
        </div>
      </div>

      {/* Service Selection */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Service
            </label>
            <select
              value={selectedService || currentService?.id || ''}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currentService && (
                <option value={currentService.id}>
                  Today - {currentService.theme || 'Sunday Service'} (Current)
                </option>
              )}
              {upcomingServices?.map((service) => (
                <option key={service.id} value={service.id}>
                  {new Date(service.date).toLocaleDateString()} - {service.theme || 'Service'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>{checkedInMembers.size} Checked In</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Search and Check-In Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="lg:col-span-2">
          <Card title="Member Search">
            {/* Search Input */}
            <div className="relative mb-6">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Members List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members?.data && members.data.length > 0 ? (
                members.data.map((member) => {
                  const isCheckedIn = checkedInMembers.has(member.id);
                  const justCheckedIn = showSuccess === member.id;

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        isCheckedIn
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                      } ${justCheckedIn ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-full w-full text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isCheckedIn ? (
                          <span className="flex items-center text-green-600 font-medium">
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Checked In
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCheckIn(member.id)}
                            isLoading={markAttendanceMutation.isPending}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Search for members to check them in</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Stats Panel */}
        <div className="space-y-6">
          <Card title="Today's Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Present</span>
                <span className="font-bold text-green-900">{checkedInMembers.size}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Late Arrivals</span>
                <span className="font-bold text-yellow-900">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">First-time Visitors</span>
                <span className="font-bold text-blue-900">0</span>
              </div>
            </div>
          </Card>

          <Card title="Recent Check-ins">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Array.from(checkedInMembers).slice(-5).reverse().map((memberId) => {
                const member = members?.data?.find((m) => m.id === memberId);
                return member ? (
                  <div key={memberId} className="flex items-center p-2 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                      {member.profilePicture ? (
                        <img src={member.profilePicture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircleIcon className="h-full w-full text-gray-400" />
                      )}
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                ) : null;
              })}
              {checkedInMembers.size === 0 && (
                <p className="text-center text-gray-500 py-4">No check-ins yet</p>
              )}
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-2">
              <Button variant="outline" fullWidth>
                Bulk Import Attendance
              </Button>
              <Button variant="outline" fullWidth>
                Mark All Present
              </Button>
              <Button variant="outline" fullWidth>
                Export Today&apos;s List
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
