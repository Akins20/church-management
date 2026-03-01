'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ministryService, userService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import { Ministry } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function MinistryManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 100),
  });

  const { data: allMembers } = useQuery({
    queryKey: ['allMembers', memberSearch],
    queryFn: () => userService.getUsers({ search: memberSearch || undefined }, 1, 50),
    enabled: isMembersModalOpen,
  });

  const [newMinistry, setNewMinistry] = useState({
    name: '',
    description: '',
    category: '',
    meetingSchedule: '',
    location: '',
  });

  const createMutation = useMutation({
    mutationFn: ministryService.createMinistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setIsCreateModalOpen(false);
      setNewMinistry({ name: '', description: '', category: '', meetingSchedule: '', location: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ministry> }) =>
      ministryService.updateMinistry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ministryService.deleteMinistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ ministryId, userId }: { ministryId: string; userId: string }) =>
      ministryService.addMember(ministryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ ministryId, userId }: { ministryId: string; userId: string }) =>
      ministryService.removeMember(ministryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newMinistry as any);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMinistry) {
      updateMutation.mutate({ id: selectedMinistry.id, data: selectedMinistry });
    }
  };

  const filteredMinistries = ministries?.data?.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <Loading fullScreen text="Loading ministries..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ministry Management</h1>
          <p className="text-gray-600">Create and manage church ministries</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Ministry
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search ministries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ministries Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ministry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Members
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Schedule
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMinistries && filteredMinistries.length > 0 ? (
                filteredMinistries.map((ministry) => (
                  <tr key={ministry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <UserGroupIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{ministry.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {ministry.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {ministry.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          setSelectedMinistry(ministry);
                          setIsMembersModalOpen(true);
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {ministry.members?.length || 0} members
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {ministry.meetingSchedule || 'Not set'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMinistry(ministry);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this ministry?')) {
                              deleteMutation.mutate(ministry.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No ministries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Ministry Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Ministry"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Ministry Name"
            value={newMinistry.name}
            onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newMinistry.description}
              onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newMinistry.category}
              onChange={(e) => setNewMinistry({ ...newMinistry, category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value="Worship">Worship</option>
              <option value="Youth">Youth</option>
              <option value="Outreach">Outreach</option>
              <option value="Education">Education</option>
              <option value="Support">Support</option>
              <option value="Media">Media</option>
            </select>
          </div>
          <Input
            label="Meeting Schedule"
            placeholder="e.g., Every Sunday 9 AM"
            value={newMinistry.meetingSchedule}
            onChange={(e) => setNewMinistry({ ...newMinistry, meetingSchedule: e.target.value })}
          />
          <Input
            label="Location"
            placeholder="e.g., Main Hall"
            value={newMinistry.location}
            onChange={(e) => setNewMinistry({ ...newMinistry, location: e.target.value })}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Ministry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Ministry Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Ministry"
        size="lg"
      >
        {selectedMinistry && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Ministry Name"
              value={selectedMinistry.name}
              onChange={(e) => setSelectedMinistry({ ...selectedMinistry, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={selectedMinistry.description}
                onChange={(e) => setSelectedMinistry({ ...selectedMinistry, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <Input
              label="Meeting Schedule"
              value={selectedMinistry.meetingSchedule || ''}
              onChange={(e) => setSelectedMinistry({ ...selectedMinistry, meetingSchedule: e.target.value })}
            />
            <Input
              label="Location"
              value={selectedMinistry.location || ''}
              onChange={(e) => setSelectedMinistry({ ...selectedMinistry, location: e.target.value })}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Members Modal */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title={`${selectedMinistry?.name} - Members`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Add Member */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members to add..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Results */}
          {memberSearch && (
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {allMembers?.data
                ?.filter((m) => !selectedMinistry?.members?.includes(m.id))
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        selectedMinistry &&
                        addMemberMutation.mutate({
                          ministryId: selectedMinistry.id,
                          userId: member.id,
                        })
                      }
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}

          {/* Current Members */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Members</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedMinistry?.members && selectedMinistry.members.length > 0 ? (
                selectedMinistry.members.map((memberId) => {
                  const member = allMembers?.data?.find((m) => m.id === memberId);
                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span>{member ? `${member.firstName} ${member.lastName}` : memberId}</span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          removeMemberMutation.mutate({
                            ministryId: selectedMinistry.id,
                            userId: memberId,
                          })
                        }
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">No members yet</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
