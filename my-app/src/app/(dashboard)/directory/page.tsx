'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService, ministryService, departmentService } from '@/services';
import { Card, Button, Input, Loading } from '@/components/common';
import { UserRole, MembershipStatus } from '@/types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function MemberDirectory() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | ''>('');
  const [ministryFilter, setMinistryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  const { data: users, isLoading } = useQuery({
    queryKey: ['directory', search, roleFilter, statusFilter, ministryFilter, currentPage],
    queryFn: () =>
      userService.getUsers(
        {
          search: search || undefined,
          role: roleFilter || undefined,
          membershipStatus: statusFilter || undefined,
          ministryId: ministryFilter || undefined,
        },
        currentPage,
        limit
      ),
  });

  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 100),
  });

  const clearFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setMinistryFilter('');
    setSearch('');
  };

  const hasActiveFilters = roleFilter || statusFilter || ministryFilter || search;

  if (isLoading) {
    return <Loading fullScreen text="Loading directory..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
          <p className="text-gray-600">Search members by name or email and view their contact details and ministries.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search members by name, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value={UserRole.NEWCOMER}>Newcomer</option>
                <option value={UserRole.MEMBER}>Member</option>
                <option value={UserRole.STAFF}>Staff</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | '')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value={MembershipStatus.ACTIVE}>Active</option>
                <option value={MembershipStatus.INACTIVE}>Inactive</option>
                <option value={MembershipStatus.SUSPENDED}>Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ministry</label>
              <select
                value={ministryFilter}
                onChange={(e) => setMinistryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Ministries</option>
                {ministries?.data?.map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {users?.data?.length || 0} of {users?.total || 0} members
      </div>

      {/* Member Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {users?.data && users.data.length > 0 ? (
          users.data.map((member) => (
            <Card key={member.id} hoverable className="transition-transform hover:scale-105">
              <div className="flex flex-col items-center text-center">
                {/* Profile Picture */}
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-full h-full text-gray-400" />
                  )}
                </div>

                {/* Name and Role */}
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.firstName} {member.lastName}
                </h3>
                <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                  member.role === UserRole.ADMIN
                    ? 'bg-purple-100 text-purple-800'
                    : member.role === UserRole.STAFF
                    ? 'bg-blue-100 text-blue-800'
                    : member.role === UserRole.MEMBER
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>

                {/* Contact Info */}
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Member Since */}
                <p className="mt-4 text-xs text-gray-500">
                  Member since {member.dateJoined ? new Date(member.dateJoined).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  }) : 'N/A'}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <UserCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No members found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {users && users.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {users.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === users.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
