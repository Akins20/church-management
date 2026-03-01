'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Card, Button, Loading } from '@/components/common';
import {
  QueueListIcon,
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface QueueJob {
  id: string;
  name: string;
  data: Record<string, any>;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedReason?: string;
  progress?: number;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export default function QueueManagement() {
  const queryClient = useQueryClient();
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: queueStats, isLoading: statsLoading } = useQuery({
    queryKey: ['queueStats'],
    queryFn: adminService.getQueueStats,
    refetchInterval: 5000,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['queueJobs', selectedQueue, selectedStatus],
    queryFn: () => adminService.getQueueJobs(selectedQueue, selectedStatus),
    refetchInterval: 5000,
  });

  const retryJobMutation = useMutation({
    mutationFn: adminService.retryJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueJobs'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
    },
  });

  const removeJobMutation = useMutation({
    mutationFn: adminService.removeJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueJobs'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
    },
  });

  const clearQueueMutation = useMutation({
    mutationFn: (status: string) => adminService.clearQueue(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueJobs'] });
      queryClient.invalidateQueries({ queryKey: ['queueStats'] });
    },
  });

  // Mock data for demonstration
  const mockStats: QueueStats = queueStats || {
    waiting: 12,
    active: 3,
    completed: 1245,
    failed: 8,
    delayed: 2,
  };

  const mockJobs: QueueJob[] = jobs || [
    {
      id: '1',
      name: 'sendEmail',
      data: { to: 'member@example.com', subject: 'Welcome!' },
      status: 'active',
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      progress: 45,
    },
    {
      id: '2',
      name: 'processAttendance',
      data: { serviceId: 'service-123' },
      status: 'waiting',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: '3',
      name: 'sendBulkEmail',
      data: { templateId: 'welcome', recipients: 150 },
      status: 'failed',
      attempts: 3,
      maxAttempts: 3,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      failedReason: 'SMTP connection timeout',
    },
    {
      id: '4',
      name: 'generateReport',
      data: { type: 'attendance', period: 'monthly' },
      status: 'completed',
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 7000000).toISOString(),
    },
    {
      id: '5',
      name: 'syncExternalData',
      data: { source: 'google-calendar' },
      status: 'delayed',
      attempts: 2,
      maxAttempts: 3,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const queues = [
    { id: 'all', name: 'All Queues' },
    { id: 'email', name: 'Email Queue' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'reports', name: 'Reports' },
    { id: 'sync', name: 'Sync Jobs' },
  ];

  const statuses = [
    { id: 'all', name: 'All Status' },
    { id: 'waiting', name: 'Waiting' },
    { id: 'active', name: 'Active' },
    { id: 'completed', name: 'Completed' },
    { id: 'failed', name: 'Failed' },
    { id: 'delayed', name: 'Delayed' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'active':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'delayed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const isLoading = statsLoading || jobsLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading queue data..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
          <p className="text-gray-600">Monitor and manage background job queues</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['queueJobs'] });
              queryClient.invalidateQueries({ queryKey: ['queueStats'] });
            }}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Waiting</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.waiting}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <ArrowPathIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.completed}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.failed}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delayed</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.delayed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Queue</label>
            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {queues.map((queue) => (
                <option key={queue.id} value={queue.id}>
                  {queue.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Clear all completed jobs?')) {
                  clearQueueMutation.mutate('completed');
                }
              }}
            >
              Clear Completed
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Clear all failed jobs?')) {
                  clearQueueMutation.mutate('failed');
                }
              }}
            >
              Clear Failed
            </Button>
          </div>
        </div>
      </Card>

      {/* Jobs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attempts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <QueueListIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.name}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {JSON.stringify(job.data).substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    {job.failedReason && (
                      <p className="text-xs text-red-600 mt-1">{job.failedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {job.status === 'active' && job.progress !== undefined ? (
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {job.attempts} / {job.maxAttempts}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatTimestamp(job.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {job.status === 'failed' && (
                        <button
                          onClick={() => retryJobMutation.mutate(job.id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Retry"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}
                      {(job.status === 'waiting' || job.status === 'failed') && (
                        <button
                          onClick={() => {
                            if (confirm('Remove this job?')) {
                              removeJobMutation.mutate(job.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Remove"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {mockJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No jobs found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Queue Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Queue Health">
          <div className="space-y-4">
            {[
              { name: 'Email Queue', status: 'healthy', throughput: '125 jobs/min', lag: '2s' },
              { name: 'Notifications', status: 'healthy', throughput: '89 jobs/min', lag: '1s' },
              { name: 'Reports', status: 'warning', throughput: '12 jobs/min', lag: '45s' },
              { name: 'Sync Jobs', status: 'healthy', throughput: '34 jobs/min', lag: '5s' },
            ].map((queue) => (
              <div
                key={queue.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`h-3 w-3 rounded-full mr-3 ${
                      queue.status === 'healthy'
                        ? 'bg-green-500'
                        : queue.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium text-gray-900">{queue.name}</span>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">{queue.throughput}</p>
                  <p className="text-gray-400">Lag: {queue.lag}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="space-y-3">
            {[
              { time: '2 min ago', message: 'Bulk email job completed (150 emails sent)' },
              { time: '5 min ago', message: 'Attendance sync job started' },
              { time: '12 min ago', message: 'Report generation failed - retrying' },
              { time: '18 min ago', message: 'Weekly reminder emails queued (245 jobs)' },
              { time: '25 min ago', message: 'Database backup completed successfully' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                <div>
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
