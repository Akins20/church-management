import apiClient from '@/lib/api-client';
import { Sermon, SermonFilters, PaginatedResponse } from '@/types';

// Helper to extract data from API response
const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const sermonService = {
  // Get all sermons
  getSermons: async (filters?: SermonFilters, page = 1, limit = 20): Promise<PaginatedResponse<Sermon>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/sermons', { params });
    const data = extractData<any>(response);

    // Handle both paginated and array responses
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }

    // If it's already paginated format
    if (data && Array.isArray(data.data)) {
      return data;
    }

    // If data has sermons array
    if (data && Array.isArray(data.sermons)) {
      return {
        data: data.sermons,
        total: data.total || data.sermons.length,
        page: data.page || 1,
        limit: data.limit || data.sermons.length,
        totalPages: data.totalPages || 1,
      };
    }

    return {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
  },

  // Get recent sermons
  getRecentSermons: async (limit = 10): Promise<Sermon[]> => {
    const response = await apiClient.get('/sermons/recent', { params: { limit } });
    const data = extractData<any>(response);
    return Array.isArray(data) ? data : (data?.sermons || []);
  },

  // Get sermons by series
  getSermonsBySeries: async (series: string): Promise<Sermon[]> => {
    const response = await apiClient.get(`/sermons/series/${series}`);
    const data = extractData<any>(response);
    return Array.isArray(data) ? data : (data?.sermons || []);
  },

  // Get sermon by ID
  getSermonById: async (id: string): Promise<Sermon> => {
    const response = await apiClient.get(`/sermons/${id}`);
    return extractData(response);
  },

  // Create sermon
  createSermon: async (data: Partial<Sermon>): Promise<Sermon> => {
    const response = await apiClient.post('/sermons', data);
    return extractData(response);
  },

  // Update sermon
  updateSermon: async (id: string, data: Partial<Sermon>): Promise<Sermon> => {
    const response = await apiClient.put(`/sermons/${id}`, data);
    return extractData(response);
  },

  // Publish sermon
  publishSermon: async (id: string, published: boolean): Promise<Sermon> => {
    const response = await apiClient.patch(`/sermons/${id}/publish`, { published });
    return extractData(response);
  },

  // Delete sermon
  deleteSermon: async (id: string): Promise<void> => {
    await apiClient.delete(`/sermons/${id}`);
  },

  // Track sermon view
  trackView: async (id: string): Promise<void> => {
    await apiClient.post(`/sermons/${id}/view`);
  },

  // Track sermon download
  trackDownload: async (id: string): Promise<void> => {
    await apiClient.post(`/sermons/${id}/download`);
  },

  // Get sermon statistics
  getSermonStats: async (): Promise<any> => {
    const response = await apiClient.get('/sermons/stats');
    return extractData(response);
  },

  // Export sermon as PDF
  exportSermonPDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/sermons/${id}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
};
