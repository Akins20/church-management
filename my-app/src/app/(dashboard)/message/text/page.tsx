'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services';
import { Card, Button, Loading } from '@/components/common';
import {
  DevicePhoneMobileIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api-client';

const churchGroups = [
  { value: 'all', label: 'All Members' },
  { value: 'newcomer', label: 'Newcomers' },
  { value: 'women', label: 'Women Group' },
  { value: 'men', label: 'Men Group' },
  { value: 'youth', label: 'Youth Group' },
  { value: 'children', label: 'Children Ministry' },
  { value: 'choir', label: 'Choir' },
  { value: 'usher', label: 'Ushers' },
  { value: 'staff', label: 'Staff Only' },
];

interface SmsStats {
  totalSent: number;
  delivered: number;
  pending: number;
  failed: number;
}

interface SmsMessage {
  id: string;
  recipient: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function MessageTextPage() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    recipientGroup: '',
    message: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({}, 1, 500),
  });

  // SMS Stats query - using a placeholder endpoint
  const { data: smsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['smsStats'],
    queryFn: async (): Promise<SmsStats> => {
      try {
        const response = await apiClient.get('/sms/stats');
        return response.data;
      } catch {
        // Return default stats if endpoint doesn't exist
        return { totalSent: 0, delivered: 0, pending: 0, failed: 0 };
      }
    },
  });

  // Recent SMS query
  const { data: recentSms, isLoading: smsLoading } = useQuery({
    queryKey: ['recentSms'],
    queryFn: async (): Promise<SmsMessage[]> => {
      try {
        const response = await apiClient.get('/sms', { params: { limit: 10 } });
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
      } catch {
        return [];
      }
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: { phoneNumbers: string[]; message: string }) => {
      const response = await apiClient.post('/sms/broadcast', data);
      return response.data;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setFormData({ recipientGroup: '', message: '' });
      setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['smsStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentSms'] });
    },
    onError: (error: any) => {
      console.error('Failed to send SMS:', error);
      setErrors({ submit: error?.response?.data?.message || 'Failed to send messages' });
    },
  });

  const getRecipientsForGroup = (group: string): { phone: string; name: string }[] => {
    if (!users?.data) return [];

    const filteredUsers = group === 'all'
      ? users.data
      : users.data.filter(u => {
          if (group === 'staff') {
            return u.role?.toLowerCase() === 'staff' || u.role?.toLowerCase() === 'admin';
          }
          if (group === 'newcomer') {
            return u.role?.toLowerCase() === 'newcomer';
          }
          // Check group field
          if (u.group?.toLowerCase() === group.toLowerCase()) {
            return true;
          }
          // Check ministries
          return u.ministries?.some(m => {
            const ministryName = typeof m === 'string' ? m : m.name;
            return ministryName?.toLowerCase().includes(group.toLowerCase());
          });
        });

    return filteredUsers
      .filter(u => u.phone)
      .map(u => ({ phone: u.phone!, name: `${u.firstName} ${u.lastName}` }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientGroup) {
      newErrors.recipientGroup = 'Please select a recipient group';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (formData.message.length > 160) {
      newErrors.message = 'Message must be 160 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const recipients = getRecipientsForGroup(formData.recipientGroup);
    if (recipients.length === 0) {
      setErrors({ recipientGroup: 'No recipients with phone numbers found for this group' });
      return;
    }

    sendSmsMutation.mutate({
      phoneNumbers: recipients.map(r => r.phone),
      message: formData.message,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const recipientCount = formData.recipientGroup
    ? getRecipientsForGroup(formData.recipientGroup).length
    : 0;

  const charactersRemaining = 160 - formData.message.length;

  const stats = [
    {
      name: 'Total Sent',
      value: smsStats?.totalSent || 0,
      icon: PaperAirplaneIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Delivered',
      value: smsStats?.delivered || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending',
      value: smsStats?.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Failed',
      value: smsStats?.failed || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
  ];

  if (statsLoading || smsLoading) {
    return <Loading fullScreen text="Loading SMS center..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Text Message</h1>
        <p className="text-gray-600">Send SMS messages to church groups and members</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <p className="font-medium text-green-800">Messages Sent Successfully!</p>
            <p className="text-green-600 text-sm">Your text messages have been queued for delivery.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <XCircleIcon className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <p className="font-medium text-red-800">Failed to Send</p>
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Compose Form */}
        <div className="lg:col-span-2">
          <Card title="Compose Text Message">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Recipient Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Group <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="recipientGroup"
                    value={formData.recipientGroup}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none bg-white ${
                      errors.recipientGroup ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a group</option>
                    {churchGroups.map(group => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.recipientGroup && (
                  <p className="mt-1 text-sm text-red-500">{errors.recipientGroup}</p>
                )}
                {formData.recipientGroup && (
                  <p className="mt-1 text-sm text-blue-600">
                    {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} with phone numbers will receive this message
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Type your message here..."
                    rows={4}
                    maxLength={160}
                    className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 resize-none ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  {errors.message ? (
                    <p className="text-sm text-red-500">{errors.message}</p>
                  ) : (
                    <span className="text-sm text-gray-500">Standard SMS limit</span>
                  )}
                  <span className={`text-sm ${charactersRemaining < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                    {charactersRemaining} characters remaining
                  </span>
                </div>
              </div>

              {/* Message Preview */}
              {formData.message && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
                  <div className="bg-green-100 rounded-xl rounded-bl-none p-3 max-w-xs">
                    <p className="text-sm text-gray-800">{formData.message}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={sendSmsMutation.isPending}
                >
                  <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                  Send Text Message
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Recent Messages */}
          <Card title="Recent Messages">
            <div className="space-y-3">
              {recentSms && recentSms.length > 0 ? (
                recentSms.slice(0, 5).map((sms) => (
                  <div
                    key={sms.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-start">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {sms.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          To: {sms.recipient}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              sms.status === 'SENT' || sms.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : sms.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sms.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(sms.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DevicePhoneMobileIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No messages sent yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Tips Card */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">SMS Tips</h3>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Keep messages under 160 characters</li>
                  <li>• Include church name for recognition</li>
                  <li>• Avoid special characters</li>
                  <li>• Best sent during business hours</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Cost Estimate */}
          {formData.recipientGroup && recipientCount > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Estimated Cost</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {recipientCount} message{recipientCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
