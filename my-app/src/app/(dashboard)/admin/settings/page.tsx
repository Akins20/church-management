'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Card, Button, Input, Loading } from '@/components/common';
import {
  Cog6ToothIcon,
  BellIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface SystemSettings {
  general: {
    churchName: string;
    churchEmail: string;
    churchPhone: string;
    churchAddress: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    attendanceReminders: boolean;
    eventReminders: boolean;
    birthdayNotifications: boolean;
  };
  security: {
    passwordMinLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorEnabled: boolean;
  };
  appearance: {
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    darkModeEnabled: boolean;
  };
}

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: adminService.getSettings,
  });

  const [formData, setFormData] = useState<SystemSettings>({
    general: {
      churchName: 'Grace Community Church',
      churchEmail: 'info@gracechurch.org',
      churchPhone: '(555) 123-4567',
      churchAddress: '123 Main Street, City, State 12345',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    },
    email: {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@gracechurch.org',
      fromName: 'Grace Community Church',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      attendanceReminders: true,
      eventReminders: true,
      birthdayNotifications: true,
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      twoFactorEnabled: false,
    },
    appearance: {
      primaryColor: '#3B82F6',
      logoUrl: '',
      faviconUrl: '',
      darkModeEnabled: false,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) => adminService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  const handleSave = () => {
    setSaveStatus('saving');
    updateSettingsMutation.mutate(formData);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ];

  if (isLoading) {
    return <Loading fullScreen text="Loading settings..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your church management system</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveStatus === 'saved' && (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              Settings saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center text-red-600 text-sm">
              <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
              Error saving settings
            </span>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saveStatus === 'saving'}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card title="General Settings">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Church Name"
                    value={formData.general.churchName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, churchName: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.general.churchEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, churchEmail: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    value={formData.general.churchPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, churchPhone: e.target.value },
                      })
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.general.timezone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          general: { ...formData.general, timezone: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Church Address
                  </label>
                  <textarea
                    value={formData.general.churchAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, churchAddress: e.target.value },
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={formData.general.dateFormat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          general: { ...formData.general, dateFormat: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Format
                    </label>
                    <select
                      value={formData.general.timeFormat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          general: { ...formData.general, timeFormat: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <Card title="Email Configuration">
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Configure your SMTP settings to enable email functionality. Contact your email
                    provider for the correct settings.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="SMTP Host"
                    value={formData.email.smtpHost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, smtpHost: e.target.value },
                      })
                    }
                    placeholder="smtp.example.com"
                  />
                  <Input
                    label="SMTP Port"
                    type="number"
                    value={formData.email.smtpPort.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, smtpPort: parseInt(e.target.value) || 587 },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="SMTP Username"
                    value={formData.email.smtpUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, smtpUser: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="SMTP Password"
                    type="password"
                    value={formData.email.smtpPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, smtpPassword: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="From Email"
                    type="email"
                    value={formData.email.fromEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, fromEmail: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="From Name"
                    value={formData.email.fromName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, fromName: e.target.value },
                      })
                    }
                  />
                </div>
                <Button variant="outline">
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card title="Notification Settings">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Channels</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications via email' },
                      { key: 'smsNotifications', label: 'SMS Notifications', description: 'Send notifications via SMS (requires SMS provider)' },
                      { key: 'pushNotifications', label: 'Push Notifications', description: 'Send push notifications to mobile app users' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notifications[item.key as keyof typeof formData.notifications]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notifications: {
                                  ...formData.notifications,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Automatic Reminders</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'attendanceReminders', label: 'Attendance Reminders', description: 'Remind members about upcoming services' },
                      { key: 'eventReminders', label: 'Event Reminders', description: 'Send reminders for upcoming events' },
                      { key: 'birthdayNotifications', label: 'Birthday Notifications', description: 'Send birthday wishes to members' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notifications[item.key as keyof typeof formData.notifications]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notifications: {
                                  ...formData.notifications,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card title="Security Settings">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Password Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Minimum Password Length"
                      type="number"
                      value={formData.security.passwordMinLength.toString()}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: {
                            ...formData.security,
                            passwordMinLength: parseInt(e.target.value) || 8,
                          },
                        })
                      }
                    />
                    <Input
                      label="Max Login Attempts"
                      type="number"
                      value={formData.security.maxLoginAttempts.toString()}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: {
                            ...formData.security,
                            maxLoginAttempts: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.security.requireSpecialChar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            security: { ...formData.security, requireSpecialChar: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require special character</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.security.requireNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            security: { ...formData.security, requireNumber: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require number</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Session Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Session Timeout (minutes)"
                      type="number"
                      value={formData.security.sessionTimeout.toString()}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: {
                            ...formData.security,
                            sessionTimeout: parseInt(e.target.value) || 60,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Enable 2FA for all users</p>
                      <p className="text-sm text-gray-500">Require two-factor authentication for all accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.security.twoFactorEnabled}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            security: { ...formData.security, twoFactorEnabled: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card title="Appearance Settings">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.appearance.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, primaryColor: e.target.value },
                        })
                      }
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.appearance.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, primaryColor: e.target.value },
                        })
                      }
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo
                    </label>
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="text-center">
                        <PaintBrushIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Favicon
                    </label>
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="text-center">
                        <GlobeAltIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload favicon</p>
                        <p className="text-xs text-gray-400">ICO, PNG 32x32px</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-500">Enable dark mode option for users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.appearance.darkModeEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, darkModeEnabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
