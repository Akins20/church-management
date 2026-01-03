'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ministryService, userService } from '@/services';
import { useAppSelector } from '@/store/hooks';
import { selectUserRole } from '@/store/slices/authSlice';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  UserPlusIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 6;

const categories = ['Worship', 'Youth', 'Outreach', 'Education', 'Support', 'Media'];

const defaultMinistries = [
  { id: 'default-newcomer', name: 'New Comer', description: 'Welcome to our church family!', category: 'Support', meetingSchedule: 'Sundays after service', location: 'Welcome Center', members: [] },
  { id: 'default-worship', name: 'Worship Ministry', description: 'Leading the congregation in praise and worship.', category: 'Worship', meetingSchedule: 'Saturdays at 4:00 PM', location: 'Main Sanctuary', members: [] },
  { id: 'default-youth', name: 'Youth Ministry', description: 'Engaging and empowering young people.', category: 'Youth', meetingSchedule: 'Fridays at 6:00 PM', location: 'Youth Hall', members: [] },
  { id: 'default-choir', name: 'Choir Ministry', description: 'Glorifying God through choral music.', category: 'Worship', meetingSchedule: 'Wednesdays at 7:00 PM', location: 'Choir Room', members: [] },
  { id: 'default-children', name: 'Children Ministry', description: 'Nurturing children in the knowledge of Jesus.', category: 'Education', meetingSchedule: 'Sundays at 9:00 AM', location: "Children's Wing", members: [] },
  { id: 'default-mens', name: "Men's Fellowship", description: 'Building strong men of faith.', category: 'Support', meetingSchedule: 'First Saturday at 8:00 AM', location: 'Fellowship Hall', members: [] },
  { id: 'default-womens', name: "Women's Ministry", description: 'Empowering women spiritually.', category: 'Support', meetingSchedule: 'Second Saturday at 10:00 AM', location: 'Fellowship Hall', members: [] },
  { id: 'default-outreach', name: 'Outreach & Evangelism', description: 'Sharing the gospel and serving the community.', category: 'Outreach', meetingSchedule: 'Third Saturday at 9:00 AM', location: 'Church Grounds', members: [] },
  { id: 'default-media', name: 'Media & Tech Ministry', description: 'Supporting services through audio, video.', category: 'Media', meetingSchedule: 'Sundays at 7:30 AM', location: 'Media Booth', members: [] },
  { id: 'default-ushers', name: 'Ushers Ministry', description: 'Welcoming and assisting members.', category: 'Support', meetingSchedule: 'Sundays at 8:00 AM', location: 'Church Entrance', members: [] },
];

export default function MinistryDirectory() {
  const queryClient = useQueryClient();
  const userRole = useAppSelector(selectUserRole);
  const isAdmin = userRole?.toLowerCase() === 'admin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', meetingSchedule: '', location: '' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 100),
  });

  const { data: ministryDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['ministryDetails', selectedMinistry?.id],
    queryFn: () => ministryService.getMinistryById(selectedMinistry?.id),
    enabled: !!selectedMinistry?.id,
  });

  const { data: allUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(undefined, 1, 100),
    enabled: showAddMemberModal,
  });

  const apiMinistries = ministries?.data || [];
  const ministriesList = apiMinistries.length > 0 ? apiMinistries : defaultMinistries;

  // Filter and paginate
  const filteredMinistries = ministriesList.filter((m: any) => {
    if (!search.trim()) return true;
    return m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filteredMinistries.length / ITEMS_PER_PAGE);
  const paginatedMinistries = filteredMinistries.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const filteredUsers = (allUsers?.data || []).filter((user: any) => {
    if (!memberSearch.trim()) return true;
    const searchLower = memberSearch.toLowerCase();
    return (user.firstName || '').toLowerCase().includes(searchLower) ||
      (user.lastName || '').toLowerCase().includes(searchLower);
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: ({ ministryId, userId }: { ministryId: string; userId: string }) =>
      ministryService.addMember(ministryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['ministryDetails'] });
      setShowAddMemberModal(false);
      setMemberSearch('');
      setSelectedMember(null);
      setNotification({ type: 'success', message: 'Member added successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to add member' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ministryService.createMinistry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowCreateModal(false);
      resetForm();
      setNotification({ type: 'success', message: 'Ministry created successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to create ministry' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ministryService.updateMinistry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowEditModal(false);
      resetForm();
      setSelectedMinistry(null);
      setNotification({ type: 'success', message: 'Ministry updated successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to update ministry' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ministryService.deleteMinistry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowDeleteModal(false);
      setSelectedMinistry(null);
      setNotification({ type: 'success', message: 'Ministry deleted successfully' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: () => {
      setNotification({ type: 'error', message: 'Failed to delete ministry' });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const validateForm = () => {
    const errors: any = {};
    if (!formData.name.trim()) errors.name = 'Required';
    if (!formData.description.trim()) errors.description = 'Required';
    if (!formData.category) errors.category = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', meetingSchedule: '', location: '' });
    setFormErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getMembersList = () => {
    if (ministryDetails?.members && Array.isArray(ministryDetails.members)) return ministryDetails.members;
    if (selectedMinistry?.memberDetails && Array.isArray(selectedMinistry.memberDetails)) return selectedMinistry.memberDetails;
    return [];
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className="flex items-center space-x-2 text-white">
            {notification.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ministries</h1>
            <p className="text-gray-500 text-sm mt-0.5">View and manage church ministries</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ministries..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-56 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Ministry
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Left Panel - Ministries List */}
        <div className="w-72 flex flex-col shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">All Ministries</h2>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {filteredMinistries.length}
                </span>
              </div>
            </div>

            <div className="flex-1 p-4 min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : paginatedMinistries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <UserGroupIcon className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">No ministries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedMinistries.map((ministry: any) => (
                    <button
                      key={ministry.id}
                      onClick={() => setSelectedMinistry(ministry)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedMinistry?.id === ministry.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{ministry.name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{ministry.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ml-2 ${
                          selectedMinistry?.id === ministry.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {ministry.members?.length || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Page {page}/{totalPages}</p>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Ministry Details */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col">
            {selectedMinistry ? (
              <>
                {/* Ministry Header */}
                <div className="p-5 border-b border-gray-200 shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-gray-900">{selectedMinistry.name}</h2>
                        {selectedMinistry.category && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {selectedMinistry.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{selectedMinistry.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                        {selectedMinistry.meetingSchedule && (
                          <span className="flex items-center">
                            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                            {selectedMinistry.meetingSchedule}
                          </span>
                        )}
                        {selectedMinistry.location && (
                          <span className="flex items-center">
                            <MapPinIcon className="w-3.5 h-3.5 mr-1" />
                            {selectedMinistry.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 ml-4">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setFormData({
                                name: selectedMinistry.name || '',
                                description: selectedMinistry.description || '',
                                category: selectedMinistry.category || '',
                                meetingSchedule: selectedMinistry.meetingSchedule || '',
                                location: selectedMinistry.location || '',
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-xl transition-colors"
                      >
                        <UserPlusIcon className="w-3.5 h-3.5 mr-1" />
                        Add Member
                      </button>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="flex-1 p-5 min-h-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Members ({selectedMinistry.members?.length || 0})
                  </h3>
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : getMembersList().length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {getMembersList().map((member: any, index: number) => (
                        <div key={member.id || index} className="flex items-center p-3 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                            {member.firstName?.[0] || '?'}{member.lastName?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.firstName || 'Unknown'} {member.lastName || ''}
                            </p>
                            {member.email && (
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <UserGroupIcon className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">No members yet</p>
                      <p className="text-gray-400 text-xs">Click "Add Member" to add the first one</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserGroupIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Ministry</h3>
                <p className="text-gray-500 text-sm">Click on any ministry to view its members and details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add Member to {selectedMinistry?.name}</h2>
              <button onClick={() => { setShowAddMemberModal(false); setMemberSearch(''); setSelectedMember(null); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div className="max-h-60 border border-gray-200 rounded-xl divide-y divide-gray-100">
                {loadingUsers ? (
                  <div className="p-4 text-center">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.slice(0, 6).map((user: any) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedMember(user)}
                      className={`w-full flex items-center p-3 text-left transition-colors ${selectedMember?.id === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium mr-3">
                        {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                      </div>
                      {selectedMember?.id === user.id && <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No members found</div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
              <button onClick={() => { setShowAddMemberModal(false); setMemberSearch(''); setSelectedMember(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">Cancel</button>
              <button
                onClick={() => { if (selectedMinistry && selectedMember) addMemberMutation.mutate({ ministryId: selectedMinistry.id, userId: selectedMember.id }); }}
                disabled={!selectedMember || addMemberMutation.isPending}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Ministry Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{showEditModal ? 'Edit Ministry' : 'Create Ministry'}</h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} className={`w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${formErrors.name ? 'border-red-300' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={`w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none ${formErrors.description ? 'border-red-300' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} className={`w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${formErrors.category ? 'border-red-300' : 'border-gray-200'}`}>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <input name="meetingSchedule" value={formData.meetingSchedule} onChange={handleChange} placeholder="e.g., Sundays 9AM" className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Room 101" className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">Cancel</button>
              <button
                onClick={() => { if (validateForm()) { showEditModal ? updateMutation.mutate({ id: selectedMinistry.id, data: formData }) : createMutation.mutate(formData); } }}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : showEditModal ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Ministry</h2>
              <p className="text-gray-600">Are you sure you want to delete <strong>{selectedMinistry?.name}</strong>? This cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(selectedMinistry.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
