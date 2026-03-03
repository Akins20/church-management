'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Card, Button, Input, Loading } from '@/components/common';
import {
  CircleStackIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ServerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface CacheEntry {
  key: string;
  size: number;
  ttl: number;
  createdAt: string;
  hitCount: number;
}

interface CacheStats {
  totalKeys: number;
  memoryUsed: number;
  memoryLimit: number;
  hitRate: number;
  missRate: number;
  evictions: number;
}

export default function CacheManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const { data: cacheStats, isLoading: statsLoading } = useQuery({
    queryKey: ['cacheStats'],
    queryFn: adminService.getCacheStats,
    refetchInterval: 10000,
  });

  const { data: cacheKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['cacheKeys', searchQuery],
    queryFn: () => adminService.getCacheKeys(searchQuery),
  });

  const clearCacheMutation = useMutation({
    mutationFn: adminService.clearCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cacheStats'] });
      queryClient.invalidateQueries({ queryKey: ['cacheKeys'] });
    },
  });

  const deleteCacheKeyMutation = useMutation({
    mutationFn: adminService.deleteCacheKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cacheStats'] });
      queryClient.invalidateQueries({ queryKey: ['cacheKeys'] });
      setSelectedKeys([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (keys: string[]) => Promise.all(keys.map((key) => adminService.deleteCacheKey(key))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cacheStats'] });
      queryClient.invalidateQueries({ queryKey: ['cacheKeys'] });
      setSelectedKeys([]);
    },
  });

  // Mock data
  const mockStats: CacheStats = cacheStats || {
    totalKeys: 1247,
    memoryUsed: 256 * 1024 * 1024, // 256 MB
    memoryLimit: 512 * 1024 * 1024, // 512 MB
    hitRate: 94.5,
    missRate: 5.5,
    evictions: 128,
  };

  const mockCacheEntries: CacheEntry[] = cacheKeys || [
    {
      key: 'users:list:page:1',
      size: 45678,
      ttl: 3600,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      hitCount: 245,
    },
    {
      key: 'attendance:stats:2024-01',
      size: 12345,
      ttl: 86400,
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      hitCount: 89,
    },
    {
      key: 'sermons:latest:10',
      size: 78901,
      ttl: 1800,
      createdAt: new Date(Date.now() - 900000).toISOString(),
      hitCount: 567,
    },
    {
      key: 'ministries:all',
      size: 23456,
      ttl: 7200,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      hitCount: 123,
    },
    {
      key: 'settings:general',
      size: 5678,
      ttl: -1,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      hitCount: 890,
    },
    {
      key: 'analytics:dashboard:summary',
      size: 34567,
      ttl: 300,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      hitCount: 45,
    },
  ];

  const cacheCategories = [
    { name: 'User Data', keys: 345, size: '45 MB' },
    { name: 'Attendance', keys: 234, size: '32 MB' },
    { name: 'Content', keys: 189, size: '78 MB' },
    { name: 'Settings', keys: 56, size: '2 MB' },
    { name: 'Analytics', keys: 423, size: '99 MB' },
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTTL = (ttl: number) => {
    if (ttl === -1) return 'Never expires';
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`;
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h`;
    return `${Math.floor(ttl / 86400)}d`;
  };

  const toggleKeySelection = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === mockCacheEntries.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(mockCacheEntries.map((e) => e.key));
    }
  };

  const isLoading = statsLoading || keysLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading cache data..." />;
  }

  const memoryPercentage = (mockStats.memoryUsed / mockStats.memoryLimit) * 100;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cache Management</h1>
          <p className="text-gray-600">Monitor and manage application cache</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['cacheStats'] });
              queryClient.invalidateQueries({ queryKey: ['cacheKeys'] });
            }}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
                clearCacheMutation.mutate('*');
              }
            }}
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Clear All Cache
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <CircleStackIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Keys</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalKeys.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hit Rate</p>
              <p className="text-2xl font-bold text-green-600">{mockStats.hitRate}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Miss Rate</p>
              <p className="text-2xl font-bold text-yellow-600">{mockStats.missRate}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Evictions</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.evictions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Memory Usage */}
      <Card title="Memory Usage">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(mockStats.memoryUsed)} / {formatBytes(mockStats.memoryLimit)}
              </p>
              <p className="text-sm text-gray-500">{memoryPercentage.toFixed(1)}% used</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                memoryPercentage < 70
                  ? 'bg-green-100 text-green-800'
                  : memoryPercentage < 90
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {memoryPercentage < 70 ? 'Healthy' : memoryPercentage < 90 ? 'Warning' : 'Critical'}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                memoryPercentage < 70
                  ? 'bg-green-500'
                  : memoryPercentage < 90
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${memoryPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Cache Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Cache by Category">
          <div className="space-y-3">
            {cacheCategories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <ServerIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{category.keys} keys</p>
                  <p className="text-xs text-gray-500">{category.size}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-3">
            {[
              { name: 'Clear User Cache', description: 'Remove all cached user data', category: 'users' },
              { name: 'Clear Content Cache', description: 'Remove cached sermons and media', category: 'content' },
              { name: 'Clear Analytics Cache', description: 'Refresh analytics data', category: 'analytics' },
              { name: 'Clear Session Cache', description: 'Clear all user sessions', category: 'sessions' },
            ].map((action) => (
              <div
                key={action.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{action.name}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Clear ${action.name.toLowerCase()}?`)) {
                      // Would clear specific category
                      console.log(`Clearing ${action.category} cache`);
                    }
                  }}
                >
                  Clear
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cache Keys Browser */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cache Keys</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {selectedKeys.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${selectedKeys.length} selected keys?`)) {
                    bulkDeleteMutation.mutate(selectedKeys);
                  }
                }}
              >
                Delete Selected ({selectedKeys.length})
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedKeys.length === mockCacheEntries.length && mockCacheEntries.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  TTL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hits
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
              {mockCacheEntries
                .filter((entry) =>
                  searchQuery ? entry.key.toLowerCase().includes(searchQuery.toLowerCase()) : true
                )
                .map((entry) => (
                  <tr key={entry.key} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedKeys.includes(entry.key)}
                        onChange={() => toggleKeySelection(entry.key)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {entry.key}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatBytes(entry.size)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          entry.ttl === -1
                            ? 'bg-purple-100 text-purple-800'
                            : entry.ttl < 300
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {formatTTL(entry.ttl)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {entry.hitCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete cache key "${entry.key}"?`)) {
                            deleteCacheKeyMutation.mutate(entry.key);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              {mockCacheEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No cache entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cache Configuration */}
      <Card title="Cache Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default TTL (seconds)
              </label>
              <Input type="number" defaultValue="3600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Memory (MB)
              </label>
              <Input type="number" defaultValue="512" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eviction Policy
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="lru">LRU (Least Recently Used)</option>
                <option value="lfu">LFU (Least Frequently Used)</option>
                <option value="ttl">TTL (Time To Live)</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Enable Cache Compression</p>
                <p className="text-sm text-gray-500">Compress cached values to save memory</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="primary">Save Configuration</Button>
        </div>
      </Card>
    </div>
  );
}
