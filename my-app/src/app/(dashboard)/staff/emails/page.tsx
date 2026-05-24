'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService, userService } from '@/services';
import { Card, Button, Input, Modal, Loading } from '@/components/common';
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EmailCenter() {
  const queryClient = useQueryClient();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
  });

  const [broadcastData, setBroadcastData] = useState({
    subject: '',
    body: '',
    recipientFilter: 'all',
  });

  const { data: emails, isLoading: emailsLoading } = useQuery({
    queryKey: ['emails'],
    queryFn: () => emailService.getEmails(1, 50),
  });

  const { data: emailStats, isLoading: statsLoading } = useQuery({
    queryKey: ['emailStats'],
    queryFn: emailService.getEmailStats,
  });

  const { data: templates } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: emailService.getTemplates,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({}, 1, 100),
  });

  const sendMutation = useMutation({
    mutationFn: emailService.sendEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: emailService.sendBroadcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setIsBroadcastOpen(false);
      setBroadcastData({ subject: '', body: '', recipientFilter: 'all' });
    },
  });

  const retryMutation = useMutation({
    mutationFn: emailService.retryEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate(composeData);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = users?.data?.map((u) => ({ email: u.email, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() })) || [];
    broadcastMutation.mutate({
      recipients,
      subject: broadcastData.subject,
      body: broadcastData.body,
    });
  };

  const stats = [
    {
      name: 'Total Sent',
      value: emailStats?.totalSent || 0,
      icon: PaperAirplaneIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Delivered',
      value: emailStats?.delivered || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending',
      value: emailStats?.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Failed',
      value: emailStats?.failed || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
  ];

  const isLoading = emailsLoading || statsLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading email center..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
          <p className="text-gray-600">Manage church communications</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/staff/email-templates">
            <Button variant="outline">
              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
              Templates
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsBroadcastOpen(true)}>
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Broadcast
          </Button>
          <Button variant="primary" onClick={() => setIsComposeOpen(true)}>
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Emails */}
      <Card title="Recent Emails">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {emails?.emails && emails.emails.length > 0 ? (
                emails.emails.map((email) => (
                  <tr key={email._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {email.recipients?.[0]?.email}
                          {email.recipients && email.recipients.length > 1 ? ` +${email.recipients.length - 1}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {email.subject}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          email.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : email.status === 'pending' || email.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {email.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(email.sentAt || email.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {email.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryMutation.mutate(email._id)}
                          isLoading={retryMutation.isPending}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No emails sent yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compose Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Email"
        size="lg"
      >
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select
              value={composeData.to}
              onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select recipient</option>
              {users?.data?.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Subject"
            value={composeData.subject}
            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={composeData.body}
              onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              required
            />
          </div>

          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or use a template
              </label>
              <select
                onChange={(e) => {
                  const template = templates.find((t) => t.id === e.target.value);
                  if (template) {
                    setComposeData({
                      ...composeData,
                      subject: template.subject,
                      body: template.body,
                    });
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={sendMutation.isPending}>
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </Modal>

      {/* Broadcast Modal */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Send Broadcast"
        size="lg"
      >
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              This will send to all {users?.data?.length || 0} members
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Group
            </label>
            <select
              value={broadcastData.recipientFilter}
              onChange={(e) =>
                setBroadcastData({ ...broadcastData, recipientFilter: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Members</option>
              <option value="active">Active Members Only</option>
              <option value="staff">Staff Only</option>
              <option value="newcomers">Newcomers Only</option>
            </select>
          </div>

          <Input
            label="Subject"
            value={broadcastData.subject}
            onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={broadcastData.body}
              onChange={(e) => setBroadcastData({ ...broadcastData, body: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={broadcastMutation.isPending}>
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Send Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
