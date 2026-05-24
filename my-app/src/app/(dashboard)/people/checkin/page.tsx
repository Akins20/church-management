'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService, ministryService } from '@/services';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  XMarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';

type CheckInMode = 'search' | 'new_member' | 'quick_checkin';

type GroupKey = 'men' | 'women' | 'youth' | 'teenagers' | 'children';

const GROUP_OPTIONS: { key: GroupKey; label: string; tint: string; fg: string }[] = [
  { key: 'men', label: 'Men', tint: 'bg-blue-500/10', fg: 'text-blue-600' },
  { key: 'women', label: 'Women', tint: 'bg-rose-500/10', fg: 'text-rose-600' },
  { key: 'youth', label: 'Youth', tint: 'bg-violet-500/10', fg: 'text-violet-600' },
  { key: 'teenagers', label: 'Teenagers', tint: 'bg-amber-500/10', fg: 'text-amber-600' },
  { key: 'children', label: 'Children', tint: 'bg-emerald-500/10', fg: 'text-emerald-600' },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ministryIds: string[];
  group: GroupKey | '';
}

const ITEMS_PER_PAGE = 6;

export default function PeopleCheckInPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CheckInMode>('search');
  const [checkinPage, setCheckinPage] = useState(1);
  const [showTodayPanel, setShowTodayPanel] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ministryIds: [],
    group: '',
  });
  const [lookupResult, setLookupResult] = useState<{
    exists: boolean;
    user: any;
    alreadyCheckedInToday: boolean;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [ministryQuery, setMinistryQuery] = useState('');

  // Fetch ministries
  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 50),
  });

  // Fetch today's attendance
  const { data: todayAttendance, refetch: refetchToday } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getTodayAttendance(),
    refetchInterval: 30000,
  });

  // Lookup mutation
  const lookupMutation = useMutation({
    mutationFn: ({ firstName, lastName }: { firstName: string; lastName: string }) =>
      attendanceService.lookupUser(firstName, lastName),
    onSuccess: (data) => {
      setLookupResult(data);
      if (data.exists && data.user) {
        // Prefill the member's stored group (sticky demographic) if present
        const existingGroup = (data.user as any).group as GroupKey | undefined;
        if (existingGroup) {
          setFormData((prev) => ({ ...prev, group: existingGroup }));
        }
        if (data.alreadyCheckedInToday) {
          setMode('search');
          setNotification({
            type: 'warning',
            message: `${data.user.firstName} ${data.user.lastName} has already checked in today`,
          });
        } else {
          setMode('quick_checkin');
          setNotification({
            type: 'success',
            message: `Member found! Ready to check in ${data.user.firstName} ${data.user.lastName}`,
          });
        }
      } else {
        setMode('new_member');
        setNotification({
          type: 'warning',
          message: 'Member not found. Please complete registration to check in.',
        });
      }
    },
    onError: () => {
      setMode('new_member');
      setNotification({
        type: 'warning',
        message: 'Member not found. Please complete registration.',
      });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      ministryIds?: string[];
      group?: GroupKey;
    }) => attendanceService.checkIn(data),
    onSuccess: (data) => {
      setNotification({
        type: 'success',
        message: data.isNewMember
          ? `Welcome! ${data.user.firstName} has been registered and checked in.`
          : `${data.user.firstName} ${data.user.lastName} checked in successfully!`,
      });
      resetForm();
      refetchToday();
      setCheckinPage(1);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Check-in failed. Please try again.',
      });
    },
  });

  // Debounced lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.firstName.length >= 2 && formData.lastName.length >= 2 && mode === 'search') {
        lookupMutation.mutate({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.firstName, formData.lastName]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', ministryIds: [], group: '' });
    setLookupResult(null);
    setMode('search');
    setErrors({});
    setMinistryQuery('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if ((name === 'firstName' || name === 'lastName') && mode !== 'search') {
      setMode('search');
      setLookupResult(null);
    }
  };

  const toggleMinistry = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      ministryIds: prev.ministryIds.includes(id)
        ? prev.ministryIds.filter((m) => m !== id)
        : [...prev.ministryIds, id],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (mode === 'new_member') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required for new members';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    checkInMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      ministryIds: formData.ministryIds.length > 0 ? formData.ministryIds : undefined,
      group: formData.group || undefined,
    });
  };

  const ministriesList = ministries?.data || [];
  const filteredMinistries =
    ministryQuery.trim() === ''
      ? ministriesList
      : ministriesList.filter((m: any) =>
          m.name.toLowerCase().includes(ministryQuery.toLowerCase())
        );
  const selectedMinistries = ministriesList.filter((m: any) =>
    formData.ministryIds.includes(m._id || m.id)
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Pagination for today's checkins
  const allCheckins = todayAttendance || [];
  const totalCheckins = allCheckins.length;
  const totalCheckinPages = Math.ceil(totalCheckins / ITEMS_PER_PAGE);
  const paginatedCheckins = allCheckins.slice(
    (checkinPage - 1) * ITEMS_PER_PAGE,
    checkinPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-full flex flex-col bg-gray-50 dark:bg-[#1c1c1e]">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-3 md:px-4 py-2 md:py-3 flex items-center justify-between shrink-0 ${
            notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'error'
              ? 'bg-red-500'
              : 'bg-amber-500'
          }`}
        >
          <div className="flex items-center space-x-2 text-white min-w-0">
            {notification.type === 'success' && <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />}
            {notification.type === 'error' && <XCircleIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />}
            {notification.type === 'warning' && <ExclamationTriangleIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />}
            <span className="font-medium text-xs md:text-sm truncate">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white shrink-0 ml-2">
            <XCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Check-in Form */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4 md:p-6 flex items-start justify-center">
            <div className="max-w-xl w-full">
              {/* Title — no top bar, macOS content header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Check-in</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Register attendance for members</p>
                </div>
                <button
                  onClick={() => setShowTodayPanel(true)}
                  className="lg:hidden flex items-center px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium shrink-0"
                >
                  <ListBulletIcon className="w-4 h-4 mr-1.5" />
                  Today ({totalCheckins})
                </button>
              </div>

              {/* Mode Indicator - only show when member found or new member */}
              {mode !== 'search' && (
                <div className="mb-3 md:mb-4 flex items-center space-x-2">
                  <div
                    className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium ${
                      mode === 'quick_checkin'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {mode === 'quick_checkin' && (
                      <>
                        <CheckCircleSolid className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        Member Found
                      </>
                    )}
                    {mode === 'new_member' && (
                      <>
                        <UserPlusIcon className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        New Member
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.06] p-4 md:p-5">
                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First name"
                          className={`w-full pl-8 md:pl-9 pr-2 md:pr-3 py-2 md:py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs md:text-sm text-gray-900 placeholder-gray-400 ${
                            errors.firstName ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-[10px] md:text-xs text-red-500">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last name"
                          className={`w-full pl-8 md:pl-9 pr-2 md:pr-3 py-2 md:py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs md:text-sm text-gray-900 placeholder-gray-400 ${
                            errors.lastName ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-[10px] md:text-xs text-red-500">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Member Info Display (Quick Check-in Mode) */}
                  {mode === 'quick_checkin' && lookupResult?.user && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 md:p-3">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          {lookupResult.user.firstName[0]}
                          {lookupResult.user.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-xs md:text-sm">
                            {lookupResult.user.firstName} {lookupResult.user.lastName}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-600 truncate">{lookupResult.user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Fields (New Member Mode) */}
                  {mode === 'new_member' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className={`w-full pl-8 md:pl-9 pr-2 md:pr-3 py-2 md:py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs md:text-sm text-gray-900 placeholder-gray-400 ${
                              errors.email ? 'border-red-300' : 'border-gray-200'
                            }`}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-[10px] md:text-xs text-red-500">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Phone <span className="text-gray-400 text-[10px] md:text-xs">(optional)</span>
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Phone number"
                            className="w-full pl-8 md:pl-9 pr-2 md:pr-3 py-2 md:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs md:text-sm text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Group selector (demographic: men / women / youth / teenagers / children) */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
                      Group{' '}
                      <span className="text-gray-400 text-[10px] md:text-xs font-normal">(tap to select)</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {GROUP_OPTIONS.map((opt) => {
                        const active = formData.group === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                group: prev.group === opt.key ? '' : opt.key,
                              }))
                            }
                            className={`relative flex flex-col items-center gap-1.5 py-2.5 rounded-2xl ring-1 transition-all ${
                              active
                                ? 'ring-blue-500 bg-blue-50 shadow-sm'
                                : 'ring-black/[0.06] bg-white hover:bg-gray-50'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${opt.tint} ${opt.fg}`}>
                              <UserGroupIcon className="w-4 h-4" />
                            </span>
                            <span className={`text-[11px] md:text-xs font-medium ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                              {opt.label}
                            </span>
                            {active && (
                              <CheckCircleSolid className="absolute top-1.5 right-1.5 w-4 h-4 text-blue-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ministry Field - searchable multi-select dropdown */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>
                        Ministries <span className="text-gray-400 text-[10px] md:text-xs">(select one or more, optional)</span>
                      </span>
                      {formData.ministryIds.length > 0 && (
                        <span className="text-[10px] md:text-xs text-blue-600 font-semibold">
                          {formData.ministryIds.length} selected
                        </span>
                      )}
                    </label>

                    <Combobox
                      multiple
                      value={formData.ministryIds}
                      onChange={(ids: string[]) =>
                        setFormData((prev) => ({ ...prev, ministryIds: ids }))
                      }
                    >
                      <div className="relative">
                        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white">
                          <UserGroupIcon className="absolute left-2.5 md:left-3 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                          <ComboboxInput
                            className="w-full pl-8 md:pl-9 pr-9 py-2 md:py-2.5 bg-transparent rounded-xl focus:outline-none text-xs md:text-sm text-gray-900 placeholder-gray-400"
                            placeholder={
                              ministriesList.length === 0
                                ? 'No ministries available'
                                : 'Search ministries...'
                            }
                            displayValue={() => ministryQuery}
                            onChange={(e) => setMinistryQuery(e.target.value)}
                          />
                          <ComboboxButton className="absolute right-2 inset-y-0 flex items-center">
                            <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
                          </ComboboxButton>
                        </div>

                        <ComboboxOptions className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl bg-white border border-gray-200 shadow-lg py-1 focus:outline-none">
                          {filteredMinistries.length === 0 ? (
                            <div className="px-3 py-2 text-[11px] md:text-xs text-gray-400">
                              {ministryQuery ? 'No matches found' : 'No ministries available'}
                            </div>
                          ) : (
                            filteredMinistries.map((ministry: any) => {
                              const id = ministry._id || ministry.id;
                              return (
                                <ComboboxOption
                                  key={id}
                                  value={id}
                                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs md:text-sm text-gray-700 cursor-pointer data-[focus]:bg-blue-50 data-[focus]:text-blue-700"
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={selected ? 'font-semibold text-blue-700' : ''}>
                                        {ministry.name}
                                      </span>
                                      {selected && (
                                        <CheckIcon className="w-4 h-4 text-blue-600 shrink-0" />
                                      )}
                                    </>
                                  )}
                                </ComboboxOption>
                              );
                            })
                          )}
                        </ComboboxOptions>
                      </div>
                    </Combobox>

                    {/* Selected ministry chips */}
                    {selectedMinistries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedMinistries.map((ministry: any) => {
                          const id = ministry._id || ministry.id;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] md:text-xs font-medium bg-blue-500 text-white"
                            >
                              {ministry.name}
                              <button
                                type="button"
                                onClick={() => toggleMinistry(id)}
                                className="hover:bg-white/20 rounded-full p-0.5"
                                aria-label={`Remove ${ministry.name}`}
                              >
                                <XMarkIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 md:space-x-3 pt-1 md:pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-2 md:py-2.5 px-3 md:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-xs md:text-sm"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={
                        checkInMutation.isPending ||
                        mode === 'search' ||
                        (lookupResult?.alreadyCheckedInToday ?? false)
                      }
                      className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 font-medium rounded-xl transition-all flex items-center justify-center space-x-1.5 md:space-x-2 text-xs md:text-sm ${
                        mode === 'quick_checkin'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : mode === 'new_member'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {checkInMutation.isPending ? (
                        <>
                          <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : mode === 'quick_checkin' ? (
                        <>
                          <CheckCircleSolid className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span>Check In</span>
                        </>
                      ) : mode === 'new_member' ? (
                        <>
                          <UserPlusIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Register & Check In</span>
                          <span className="sm:hidden">Register</span>
                        </>
                      ) : (
                        <span>Check In</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Today's Check-ins (Desktop) */}
        <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col">
          <div className="p-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Today&apos;s Check-ins</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {totalCheckins}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto">
            {totalCheckins === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <UserGroupIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No check-ins yet today</p>
                <p className="text-xs text-gray-400 mt-1">Check in your first member</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedCheckins.map((record) => {
                  const user = typeof record.userId === 'object' ? record.userId : null;
                  return (
                    <div
                      key={record._id}
                      className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                          {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-xs truncate">
                            {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                            <ClockIcon className="w-3 h-3" />
                            <span>{formatTime(record.checkInTime)}</span>
                            {record.isFirstTimeVisitor && (
                              <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalCheckinPages > 1 && (
            <div className="p-3 border-t border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500">
                  {checkinPage}/{totalCheckinPages}
                </p>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCheckinPage((p) => Math.max(1, p - 1))}
                    disabled={checkinPage === 1}
                    className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setCheckinPage((p) => Math.min(totalCheckinPages, p + 1))}
                    disabled={checkinPage === totalCheckinPages}
                    className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Slide-in Panel for Today's Check-ins */}
        {showTodayPanel && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowTodayPanel(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200 shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">Today&apos;s Check-ins</h2>
                  <p className="text-xs text-gray-500">{totalCheckins} total</p>
                </div>
                <button
                  onClick={() => setShowTodayPanel(false)}
                  className="p-2 -mr-2 rounded-xl hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {totalCheckins === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <UserGroupIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No check-ins yet today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedCheckins.map((record) => {
                      const user = typeof record.userId === 'object' ? record.userId : null;
                      return (
                        <div
                          key={record._id}
                          className="p-2.5 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                              {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-xs truncate">
                                {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                              </p>
                              <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                                <ClockIcon className="w-3 h-3" />
                                <span>{formatTime(record.checkInTime)}</span>
                                {record.isFirstTimeVisitor && (
                                  <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {totalCheckinPages > 1 && (
                <div className="p-3 border-t border-gray-200 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Page {checkinPage} of {totalCheckinPages}
                    </p>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCheckinPage((p) => Math.max(1, p - 1))}
                        disabled={checkinPage === 1}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setCheckinPage((p) => Math.min(totalCheckinPages, p + 1))}
                        disabled={checkinPage === totalCheckinPages}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
