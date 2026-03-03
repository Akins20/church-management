'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService, userService, sermonService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import { SundayService } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function ServicePlanning() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SundayService | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getServices(1, 50),
  });

  const { data: users } = useQuery({
    queryKey: ['staffUsers'],
    queryFn: () => userService.getUsers({ role: 'STAFF' as any }, 1, 100),
  });

  const { data: sermons } = useQuery({
    queryKey: ['sermons'],
    queryFn: () => sermonService.getSermons({}, 1, 100),
  });

  const [newService, setNewService] = useState({
    date: '',
    theme: '',
    sermonId: '',
    leaderId: '',
    team: [] as string[],
    announcements: '',
  });

  const createMutation = useMutation({
    mutationFn: serviceService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsCreateModalOpen(false);
      setNewService({
        date: '',
        theme: '',
        sermonId: '',
        leaderId: '',
        team: [],
        announcements: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SundayService> }) =>
      serviceService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsEditModalOpen(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: serviceService.completeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newService as any);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedService) {
      updateMutation.mutate({
        id: selectedService.id,
        data: {
          theme: selectedService.theme,
          sermonId: selectedService.sermonId,
          leaderId: selectedService.leaderId,
          announcements: selectedService.announcements,
        },
      });
    }
  };

  // Group services by status
  const upcomingServices = services?.data?.filter((s) => !s.completed) || [];
  const completedServices = services?.data?.filter((s) => s.completed) || [];

  if (isLoading) {
    return <Loading fullScreen text="Loading services..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Planning</h1>
          <p className="text-gray-600">Plan and manage Sunday services</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Services</p>
            <p className="text-3xl font-bold text-gray-900">{services?.total || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-3xl font-bold text-blue-600">{upcomingServices.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedServices.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Attendance</p>
            <p className="text-3xl font-bold text-purple-600">
              {services?.data?.reduce((acc, s) => acc + (s.attendanceCount || 0), 0) || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Upcoming Services */}
      <Card title="Upcoming Services">
        <div className="space-y-4">
          {upcomingServices.length > 0 ? (
            upcomingServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {service.theme || 'Sunday Service'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(service.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {service.leaderId && (
                      <p className="text-xs text-gray-400 mt-1">
                        Led by:{' '}
                        {users?.data?.find((u) => u.id === service.leaderId)?.firstName ||
                          'Unassigned'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      if (confirm('Mark this service as completed?')) {
                        completeMutation.mutate(service.id);
                      }
                    }}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No upcoming services. Create one to get started.
            </p>
          )}
        </div>
      </Card>

      {/* Recent Completed Services */}
      <Card title="Recent Completed Services">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Theme
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leader
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {completedServices.slice(0, 10).map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(service.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {service.theme || 'Sunday Service'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {service.leaderId
                      ? `${users?.data?.find((u) => u.id === service.leaderId)?.firstName || ''} ${
                          users?.data?.find((u) => u.id === service.leaderId)?.lastName || ''
                        }`
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {service.attendanceCount || 0}
                  </td>
                </tr>
              ))}
              {completedServices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No completed services yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Service Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Service"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Service Date"
            type="date"
            value={newService.date}
            onChange={(e) => setNewService({ ...newService, date: e.target.value })}
            required
          />
          <Input
            label="Theme"
            placeholder="e.g., Easter Sunday, Youth Sunday"
            value={newService.theme}
            onChange={(e) => setNewService({ ...newService, theme: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Leader
            </label>
            <select
              value={newService.leaderId}
              onChange={(e) => setNewService({ ...newService, leaderId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select leader</option>
              {users?.data?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sermon</label>
            <select
              value={newService.sermonId}
              onChange={(e) => setNewService({ ...newService, sermonId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select sermon</option>
              {sermons?.data?.map((sermon) => (
                <option key={sermon.id} value={sermon.id}>
                  {sermon.title} - {sermon.speaker}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Announcements</label>
            <textarea
              value={newService.announcements}
              onChange={(e) => setNewService({ ...newService, announcements: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any announcements for this service..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Service"
        size="lg"
      >
        {selectedService && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Theme"
              value={selectedService.theme || ''}
              onChange={(e) =>
                setSelectedService({ ...selectedService, theme: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Leader
              </label>
              <select
                value={selectedService.leaderId || ''}
                onChange={(e) =>
                  setSelectedService({ ...selectedService, leaderId: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select leader</option>
                {users?.data?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sermon</label>
              <select
                value={selectedService.sermonId || ''}
                onChange={(e) =>
                  setSelectedService({ ...selectedService, sermonId: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select sermon</option>
                {sermons?.data?.map((sermon) => (
                  <option key={sermon.id} value={sermon.id}>
                    {sermon.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcements
              </label>
              <textarea
                value={selectedService.announcements || ''}
                onChange={(e) =>
                  setSelectedService({ ...selectedService, announcements: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
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
    </div>
  );
}
