'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService, userService, ministryService } from '@/services';
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  UserIcon,
  BuildingOffice2Icon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { PaperAirplaneIcon as PaperAirplaneSolid } from '@heroicons/react/24/solid';

type RecipientType = 'group' | 'ministry' | 'individual';

const churchGroups = [
  { value: 'all', label: 'All Members' },
  { value: 'newcomer', label: 'Newcomers' },
  { value: 'staff', label: 'Staff Only' },
];

export default function MessageEmailPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipientType, setRecipientType] = useState<RecipientType>('group');
  const [formData, setFormData] = useState({
    recipientGroup: '',
    selectedMinistry: '',
    subject: '',
    body: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({}, 1, 500),
  });

  // Fetch ministries
  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 100),
  });

  const { data: emailStats } = useQuery({
    queryKey: ['emailStats'],
    queryFn: emailService.getEmailStats,
  });

  const { data: recentEmails } = useQuery({
    queryKey: ['recentEmails'],
    queryFn: () => emailService.getEmails(1, 5),
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: { recipients: string[]; subject: string; body: string }) => {
      return emailService.sendBroadcast(data);
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Email sent successfully!' });
      setFormData({ recipientGroup: '', selectedMinistry: '', subject: '', body: '' });
      setSelectedMembers([]);
      setAttachedImages([]);
      setImagePreviews([]);
      setTimeout(() => setNotification(null), 5000);
      queryClient.invalidateQueries({ queryKey: ['emailStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentEmails'] });
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to send email. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const getRecipientsForGroup = (group: string): string[] => {
    if (!users?.data) return [];

    if (group === 'all') {
      return users.data.map(u => u.email).filter(Boolean);
    }

    return users.data
      .filter(u => {
        if (group === 'staff') {
          return u.role?.toLowerCase() === 'staff' || u.role?.toLowerCase() === 'admin';
        }
        if (group === 'newcomer') {
          return u.role?.toLowerCase() === 'newcomer';
        }
        return false;
      })
      .map(u => u.email)
      .filter(Boolean);
  };

  const getRecipientsForMinistry = (ministryId: string): string[] => {
    const ministry = ministries?.data?.find((m: any) => (m._id || m.id) === ministryId);
    if (!ministry?.members) return [];

    // If members are populated with user objects
    if (ministry.members.length > 0 && typeof ministry.members[0] === 'object') {
      return ministry.members.map((m: any) => m.email).filter(Boolean);
    }

    // If members are just IDs, we need to find them in users
    const memberIds = ministry.members;
    return (users?.data || [])
      .filter((u: any) => memberIds.includes(u._id || u.id))
      .map((u: any) => u.email)
      .filter(Boolean);
  };

  const getRecipients = (): string[] => {
    if (recipientType === 'group' && formData.recipientGroup) {
      return getRecipientsForGroup(formData.recipientGroup);
    }
    if (recipientType === 'ministry' && formData.selectedMinistry) {
      return getRecipientsForMinistry(formData.selectedMinistry);
    }
    if (recipientType === 'individual' && selectedMembers.length > 0) {
      return selectedMembers.map(m => m.email).filter(Boolean);
    }
    return [];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const recipients = getRecipients();
    if (recipients.length === 0) {
      newErrors.recipients = 'Please select at least one recipient';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.body.trim()) {
      newErrors.body = 'Message body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length + attachedImages.length > 5) {
      setNotification({ type: 'error', message: 'Maximum 5 images allowed' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setAttachedImages(prev => [...prev, ...imageFiles]);

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const recipients = getRecipients();

    let bodyWithImages = formData.body;
    if (attachedImages.length > 0) {
      bodyWithImages += `\n\n[${attachedImages.length} image(s) attached]`;
    }

    sendBroadcastMutation.mutate({
      recipients,
      subject: formData.subject,
      body: bodyWithImages,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.recipients) {
      setErrors(prev => ({ ...prev, [name]: '', recipients: '' }));
    }
  };

  const toggleMember = (user: any) => {
    setSelectedMembers(prev => {
      const exists = prev.find(m => m.id === user.id || m._id === user._id);
      if (exists) {
        return prev.filter(m => m.id !== user.id && m._id !== user._id);
      }
      return [...prev, user];
    });
    if (errors.recipients) {
      setErrors(prev => ({ ...prev, recipients: '' }));
    }
  };

  const filteredUsers = (users?.data || []).filter((user: any) => {
    if (!memberSearch.trim()) return true;
    const search = memberSearch.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const recipientCount = getRecipients().length;
  const ministriesList = ministries?.data || [];

  const stats = [
    { name: 'Sent', value: emailStats?.totalSent || 0, icon: PaperAirplaneIcon, color: 'bg-blue-500' },
    { name: 'Delivered', value: emailStats?.delivered || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
    { name: 'Pending', value: emailStats?.pending || 0, icon: ClockIcon, color: 'bg-amber-500' },
    { name: 'Failed', value: emailStats?.failed || 0, icon: XCircleIcon, color: 'bg-red-500' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Notification */}
      {notification && (
        <div
          className={`px-4 py-3 flex items-center justify-between shrink-0 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex items-center space-x-2 text-white">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">Compose Email</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">Send emails to members and ministries</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 md:px-3 py-1.5 md:py-2 shrink-0">
                  <div className={`${stat.color} p-1 md:p-1.5 rounded-lg mr-1.5 md:mr-2`}>
                    <Icon className="h-3 w-3 md:h-3.5 md:w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-gray-500">{stat.name}</p>
                    <p className="text-xs md:text-sm font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-4 md:p-6 gap-4 md:gap-6">
        {/* Compose Form */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col">
            <div className="p-4 md:p-5 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">New Message</h2>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 md:p-5 overflow-y-auto">
              {/* Recipient Type Tabs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setRecipientType('group'); setSelectedMembers([]); }}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      recipientType === 'group'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <UserGroupIcon className="w-4 h-4 mr-1.5" />
                    Group
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRecipientType('ministry'); setSelectedMembers([]); }}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      recipientType === 'ministry'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <BuildingOffice2Icon className="w-4 h-4 mr-1.5" />
                    Ministry
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('individual')}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      recipientType === 'individual'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 mr-1.5" />
                    Individual
                  </button>
                </div>

                {/* Group Selection */}
                {recipientType === 'group' && (
                  <select
                    name="recipientGroup"
                    value={formData.recipientGroup}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900"
                  >
                    <option value="">Select a group</option>
                    {churchGroups.map(group => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Ministry Selection */}
                {recipientType === 'ministry' && (
                  <select
                    name="selectedMinistry"
                    value={formData.selectedMinistry}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900"
                  >
                    <option value="">Select a ministry</option>
                    {ministriesList.map((ministry: any) => (
                      <option key={ministry._id || ministry.id} value={ministry._id || ministry.id}>
                        {ministry.name} ({ministry.members?.length || 0} members)
                      </option>
                    ))}
                  </select>
                )}

                {/* Individual Member Selection */}
                {recipientType === 'individual' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members by name or email..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    {/* Selected Members */}
                    {selectedMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMembers.map((member) => (
                          <span
                            key={member.id || member._id}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg"
                          >
                            {member.firstName} {member.lastName}
                            <button
                              type="button"
                              onClick={() => toggleMember(member)}
                              className="ml-1 hover:text-blue-900"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Member List */}
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {filteredUsers.slice(0, 10).map((user: any) => {
                        const isSelected = selectedMembers.some(m => m.id === user.id || m._id === user._id);
                        return (
                          <button
                            key={user.id || user._id}
                            type="button"
                            onClick={() => toggleMember(user)}
                            className={`w-full flex items-center p-2 text-left transition-colors ${
                              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium mr-2">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            {isSelected && <CheckCircleIcon className="w-4 h-4 text-blue-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {errors.recipients && (
                  <p className="mt-1 text-xs text-red-500">{errors.recipients}</p>
                )}
                {recipientCount > 0 && (
                  <p className="mt-1 text-xs text-blue-600">
                    {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Email subject"
                    className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400 ${
                      errors.subject ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                )}
              </div>

              {/* Message Body */}
              <div className="flex-1 flex flex-col mb-4 min-h-[120px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className={`flex-1 p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400 resize-none min-h-[100px] ${
                    errors.body ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.body && (
                  <p className="mt-1 text-xs text-red-500">{errors.body}</p>
                )}
              </div>

              {/* Actions Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-3 py-2 text-sm border border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <PhotoIcon className="h-4 w-4 mr-1.5" />
                    Attach Images
                  </button>

                  {imagePreviews.length > 0 && (
                    <div className="flex space-x-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-10 w-10 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sendBroadcastMutation.isPending}
                  className="flex items-center px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  {sendBroadcastMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneSolid className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex w-72 flex-col gap-4 shrink-0">
          {/* Recent Emails */}
          <div className="bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col min-h-[200px]">
            <div className="p-4 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">Recent Emails</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {recentEmails?.data && recentEmails.data.length > 0 ? (
                <div className="space-y-2">
                  {recentEmails.data.slice(0, 5).map((email) => (
                    <div
                      key={email.id}
                      className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                          {email.subject}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                            email.status === 'SENT'
                              ? 'bg-green-100 text-green-700'
                              : email.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {email.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate">{email.to}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(email.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <EnvelopeIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No recent emails</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shrink-0">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Email Tips</h3>
                <ul className="mt-1.5 text-xs text-blue-700 space-y-1">
                  <li>Keep subject lines clear and concise</li>
                  <li>Use images sparingly for better delivery</li>
                  <li>Test with a small group first</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
