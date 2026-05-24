'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService, userService, ministryService } from '@/services';
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOffice2Icon,
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { PaperAirplaneIcon as PaperAirplaneSolid } from '@heroicons/react/24/solid';

type RecipientType = 'ministry' | 'individual';

const MAX_ATTACHMENT_SIZE = 4 * 1024 * 1024; // 4MB per file
const MAX_ATTACHMENT_TOTAL = 6 * 1024 * 1024; // 6MB total (inline base64)
const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
];

const formatBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export default function MessageEmailPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipientType, setRecipientType] = useState<RecipientType>('ministry');
  const [formData, setFormData] = useState({
    selectedMinistry: '',
    subject: '',
    body: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [attachments, setAttachments] = useState<
    { filename: string; content: string; contentType: string; size: number }[]
  >([]);
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

  const { data: recentEmails } = useQuery({
    queryKey: ['recentEmails'],
    queryFn: () => emailService.getEmails(1, 4),
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: {
      recipients: { email: string; name?: string }[];
      subject: string;
      body: string;
      attachments?: { filename: string; content: string; contentType: string; size: number }[];
    }) => {
      return emailService.sendBroadcast(data);
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Email sent successfully!' });
      setFormData({ selectedMinistry: '', subject: '', body: '' });
      setSelectedMembers([]);
      setAttachments([]);
      setTimeout(() => setNotification(null), 5000);
      queryClient.invalidateQueries({ queryKey: ['emailStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentEmails'] });
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to send email. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const ministriesList = Array.isArray(ministries?.data) ? ministries.data : ((ministries?.data as any)?.ministries || (ministries as any)?.ministries || []);

  const getRecipientsForMinistry = (ministryId: string): { email: string; name?: string }[] => {
    const ministry = ministriesList.find((m: any) => (m._id || m.id) === ministryId);
    if (!ministry?.members) return [];

    // If members are populated with user objects
    if (ministry.members.length > 0 && typeof ministry.members[0] === 'object') {
      return ministry.members
        .filter((m: any) => m.email)
        .map((m: any) => ({ email: m.email, name: `${m.firstName || ''} ${m.lastName || ''}`.trim() }));
    }

    // If members are just IDs, we need to find them in users
    const memberIds = ministry.members;
    return usersList
      .filter((u: any) => memberIds.includes(u._id || u.id) && u.email)
      .map((u: any) => ({ email: u.email, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() }));
  };

  const getRecipients = (): { email: string; name?: string }[] => {
    if (recipientType === 'ministry' && formData.selectedMinistry) {
      return getRecipientsForMinistry(formData.selectedMinistry);
    }
    if (recipientType === 'individual' && selectedMembers.length > 0) {
      return selectedMembers
        .filter((m: any) => m.email)
        .map((m: any) => ({ email: m.email, name: `${m.firstName || ''} ${m.lastName || ''}`.trim() }));
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

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = '';
    let runningTotal = attachments.reduce((s, a) => s + a.size, 0);
    const toAdd: typeof attachments = [];
    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        setNotification({ type: 'error', message: `"${file.name}" — unsupported file type` });
        setTimeout(() => setNotification(null), 3500);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setNotification({ type: 'error', message: `"${file.name}" exceeds 4MB` });
        setTimeout(() => setNotification(null), 3500);
        continue;
      }
      if (runningTotal + file.size > MAX_ATTACHMENT_TOTAL) {
        setNotification({ type: 'error', message: 'Total attachments must be 6MB or less' });
        setTimeout(() => setNotification(null), 3500);
        break;
      }
      const content = await fileToBase64(file);
      toAdd.push({ filename: file.name, content, contentType: file.type, size: file.size });
      runningTotal += file.size;
    }
    if (toAdd.length) setAttachments((prev) => [...prev, ...toAdd]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const recipients = getRecipients();

    sendBroadcastMutation.mutate({
      recipients,
      subject: formData.subject,
      body: formData.body,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.recipients) {
      setErrors(prev => ({ ...prev, [name]: '', recipients: '' }));
    }
  };

  const getUserId = (u: any) => String(u._id || u.id);

  const toggleMember = (user: any) => {
    const userId = getUserId(user);
    setSelectedMembers(prev => {
      const exists = prev.find(m => getUserId(m) === userId);
      if (exists) {
        return prev.filter(m => getUserId(m) !== userId);
      }
      return [...prev, user];
    });
    if (errors.recipients) {
      setErrors(prev => ({ ...prev, recipients: '' }));
    }
  };

  const usersList = Array.isArray(users?.data) ? users.data : ((users?.data as any)?.users || (users as any)?.users || []);
  const filteredUsers = usersList.filter((user: any) => {
    if (!memberSearch.trim()) return true;
    const search = memberSearch.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const recipientCount = getRecipients().length;

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
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
      <div className="px-4 md:px-6 pt-5 pb-3 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Compose Email</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-0.5 hidden sm:block">
              Pick recipients (a whole ministry or selected individuals), write your message, optionally attach files, then Send. Sent emails appear under Message &gt; History.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-4 md:p-6 gap-4 md:gap-3">
        {/* Compose Form */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
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
                            key={getUserId(member)}
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
                        const isSelected = selectedMembers.some(m => getUserId(m) === getUserId(user));
                        return (
                          <button
                            key={getUserId(user)}
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
                    onChange={handleFileUpload}
                    accept={ALLOWED_ATTACHMENT_TYPES.join(',')}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach images, PDFs, Word/Excel/PowerPoint or text files — up to 4MB each, 6MB total"
                    className="flex items-center px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-white/15 rounded-xl text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <PaperClipIcon className="h-4 w-4 mr-1.5" />
                    Attach files
                  </button>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.map((att, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-xs text-gray-700 dark:text-gray-300 max-w-[180px]"
                        >
                          <PaperClipIcon className="w-3 h-3 shrink-0 text-gray-400" />
                          <span className="truncate">{att.filename}</span>
                          <span className="text-gray-400 shrink-0">{formatBytes(att.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 shrink-0"
                            aria-label={`Remove ${att.filename}`}
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
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
          <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col min-h-[200px]">
            <div className="p-4 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">Recent Emails</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {recentEmails?.emails && recentEmails.emails.length > 0 ? (
                <div className="space-y-2">
                  {recentEmails.emails.slice(0, 4).map((email) => (
                    <div
                      key={email._id}
                      className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                          {email.subject}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 capitalize ${
                            email.status === 'sent'
                              ? 'bg-green-100 text-green-700'
                              : email.status === 'pending' || email.status === 'scheduled'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {email.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate">
                          {email.recipients?.[0]?.email}
                          {email.recipients && email.recipients.length > 1 ? ` +${email.recipients.length - 1}` : ''}
                        </p>
                        <span className="text-xs text-gray-400">
                          {new Date(email.sentAt || email.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shrink-0">
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
