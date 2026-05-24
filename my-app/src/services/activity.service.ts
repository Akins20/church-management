import apiClient from '@/lib/api-client';

const extractData = <T>(response: any): T => {
  if (response?.data?.data !== undefined) return response.data.data;
  return response?.data;
};

export interface ActivityActor {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ActivityLogEntry {
  _id: string;
  actor?: ActivityActor | string | null;
  actorName?: string;
  actorEmail?: string;
  action: string;
  category: string;
  description: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export interface ActivityListResult {
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActivityFilters {
  category?: string;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const toParams = (filters: ActivityFilters) => {
  const p: Record<string, string> = {};
  if (filters.category) p.category = filters.category;
  if (filters.action) p.action = filters.action;
  if (filters.search) p.search = filters.search;
  if (filters.startDate) p.startDate = filters.startDate;
  if (filters.endDate) p.endDate = filters.endDate;
  return p;
};

export interface DigestConfig {
  enabled: boolean;
  frequency: 'weekly' | 'monthly' | 'custom';
  cron?: string;
  recipients: string[];
  lastSentAt?: string;
  lastStatus?: string;
}

export const activityService = {
  list: async (filters: ActivityFilters, page = 1, limit = 25): Promise<ActivityListResult> => {
    const response = await apiClient.get('/activity', { params: { ...toParams(filters), page, limit } });
    return extractData<ActivityListResult>(response);
  },

  actions: async (): Promise<string[]> => {
    const response = await apiClient.get('/activity/actions');
    return extractData<{ actions: string[] }>(response).actions || [];
  },

  // Download a CSV export of the current filter set
  exportCsv: async (filters: ActivityFilters): Promise<void> => {
    const response = await apiClient.get('/activity/export', {
      params: toParams(filters),
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  getDigest: async (): Promise<DigestConfig> => {
    const response = await apiClient.get('/activity/digest');
    return extractData<{ config: DigestConfig }>(response).config;
  },

  updateDigest: async (data: Partial<DigestConfig>): Promise<DigestConfig> => {
    const response = await apiClient.put('/activity/digest', data);
    return extractData<{ config: DigestConfig }>(response).config;
  },

  sendDigestNow: async (): Promise<void> => {
    await apiClient.post('/activity/digest/send');
  },
};
