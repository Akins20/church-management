import apiClient from '@/lib/api-client';

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedReason?: string;
  progress?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  pending?: number;
}

export interface CacheEntry {
  key: string;
  size: number;
  ttl: number;
  createdAt: string;
  hitCount: number;
}

export interface CacheStats {
  totalKeys: number;
  memoryUsed: number;
  memoryLimit: number;
  hitRate: number;
  missRate: number;
  evictions: number;
}

export const adminService = {
  // Cache Management
  getCacheStats: async (): Promise<CacheStats> => {
    const response = await apiClient.get('/cache/stats');
    return response.data;
  },

  getCacheKeys: async (search?: string): Promise<CacheEntry[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get('/cache/keys', { params });
    return response.data;
  },

  clearCache: async (pattern?: string): Promise<void> => {
    await apiClient.post('/cache/clear', { pattern });
  },

  deleteCache: async (key: string): Promise<void> => {
    await apiClient.delete(`/cache/${encodeURIComponent(key)}`);
  },

  deleteCacheKey: async (key: string): Promise<void> => {
    await apiClient.delete(`/cache/${encodeURIComponent(key)}`);
  },

  flushCache: async (): Promise<void> => {
    await apiClient.post('/cache/flush');
  },

  warmCache: async (): Promise<void> => {
    await apiClient.post('/cache/warm');
  },

  // Queue Management
  getQueueStats: async (): Promise<QueueStats> => {
    const response = await apiClient.get('/queue/stats');
    return response.data;
  },

  getQueueJobs: async (queue?: string, status?: string): Promise<QueueJob[]> => {
    const params: Record<string, string> = {};
    if (queue && queue !== 'all') params.queue = queue;
    if (status && status !== 'all') params.status = status;
    const response = await apiClient.get('/queue/jobs', { params });
    return response.data;
  },

  getFailedJobs: async (): Promise<QueueJob[]> => {
    const response = await apiClient.get('/queue/failed');
    return response.data;
  },

  retryJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/queue/retry/${jobId}`);
  },

  removeJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/queue/jobs/${jobId}`);
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/queue/jobs/${jobId}`);
  },

  clearQueue: async (status: string): Promise<void> => {
    await apiClient.post('/queue/clear', { status });
  },

  // System Settings
  getSettings: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },

  triggerBackup: async (): Promise<void> => {
    await apiClient.post('/settings/backup');
  },

  getIntegrations: async (): Promise<Record<string, unknown>[]> => {
    const response = await apiClient.get('/settings/integrations');
    return response.data;
  },
};
