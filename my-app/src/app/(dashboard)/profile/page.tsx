'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser, updateUser } from '@/store/slices/authSlice';
import { useMutation } from '@tanstack/react-query';
import { userService, authService, mediaService } from '@/services';
import { Card, Button, Input, Modal } from '@/components/common';
import {
  UserCircleIcon,
  PencilIcon,
  KeyIcon,
  TrashIcon,
  CameraIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof formData>) => userService.updateUser(user?.id || '', data),
    onSuccess: (updatedUser) => {
      dispatch(updateUser(updatedUser));
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => authService.changePassword(passwordData.oldPassword, passwordData.newPassword),
    onSuccess: () => {
      setIsPasswordModalOpen(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePreview(URL.createObjectURL(file));
      try {
        const uploadedMedia = await mediaService.uploadFile(file, 'profile');
        await userService.updateUser(user?.id || '', { profilePicture: uploadedMedia.url } as any);
        dispatch(updateUser({ profilePicture: uploadedMedia.url }));
        setSuccessMessage('Profile picture updated!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
              {profilePreview || user?.profilePicture ? (
                <img
                  src={profilePreview || user?.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-full h-full text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
              <CameraIcon className="h-5 w-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {user?.role}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {user?.membershipStatus}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Member since {user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <KeyIcon className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Profile Form */}
      {isEditing && (
        <Card title="Edit Profile">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Profile Information */}
      {!isEditing && (
        <Card title="Profile Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">First Name</label>
              <p className="mt-1 text-gray-900">{user?.firstName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Name</label>
              <p className="mt-1 text-gray-900">{user?.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email Address</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <p className="mt-1 text-gray-900">{user?.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="mt-1 text-gray-900">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Membership Status</label>
              <p className="mt-1 text-gray-900">{user?.membershipStatus}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Ministry Affiliations */}
      <Card title="Ministry Affiliations">
        {user?.ministries && user.ministries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.ministries.map((ministry, index) => {
              const ministryId = typeof ministry === 'string' ? ministry : ministry.id;
              const ministryName = typeof ministry === 'string' ? ministry : ministry.name;
              return (
                <div key={ministryId || index} className="p-4 bg-gray-50 rounded-lg flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <UserCircleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ministryName || `Ministry ${ministryId}`}</p>
                    <p className="text-sm text-gray-500">Active Member</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            You haven&apos;t joined any ministries yet.{' '}
            <a href="/ministries" className="text-blue-600 hover:underline">
              Explore ministries
            </a>
          </p>
        )}
      </Card>

      {/* Account Actions */}
      <Card title="Account Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Privacy Settings</p>
              <p className="text-sm text-gray-500">Control who can see your profile information</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Deactivate Account</p>
              <p className="text-sm text-red-600">Temporarily disable your account</p>
            </div>
            <Button variant="danger" size="sm">
              <TrashIcon className="h-4 w-4 mr-1" />
              Deactivate
            </Button>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            name="oldPassword"
            label="Current Password"
            type="password"
            value={passwordData.oldPassword}
            onChange={handlePasswordChange}
            required
          />
          <Input
            name="newPassword"
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
          />
          <Input
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={passwordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
