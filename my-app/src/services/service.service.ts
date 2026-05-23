import apiClient from '@/lib/api-client';
import { SundayService, PaginatedResponse } from '@/types';

// Helper to extract data from API response
const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const serviceService = {
  // Get all services
  getServices: async (page = 1, limit = 20): Promise<PaginatedResponse<SundayService>> => {
    const response = await apiClient.get('/sunday-services', { params: { page, limit } });
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

    // If data has services array
    if (data && Array.isArray(data.services)) {
      return {
        data: data.services,
        total: data.total || data.services.length,
        page: data.page || 1,
        limit: data.limit || data.services.length,
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

  // Get upcoming services
  getUpcomingServices: async (): Promise<SundayService[]> => {
    const response = await apiClient.get('/sunday-services/upcoming');
    const data = extractData<any>(response);
    return Array.isArray(data) ? data : (data?.services || []);
  },

  // Get current service
  getCurrentService: async (): Promise<SundayService | null> => {
    try {
      const response = await apiClient.get('/sunday-services/current');
      return extractData(response);
    } catch {
      return null;
    }
  },

  // Get service by ID
  getServiceById: async (id: string): Promise<SundayService> => {
    const response = await apiClient.get(`/sunday-services/${id}`);
    return extractData(response);
  },

  // Create service
  createService: async (data: Partial<SundayService>): Promise<SundayService> => {
    const response = await apiClient.post('/sunday-services', data);
    return extractData(response);
  },

  // Update service
  updateService: async (id: string, data: Partial<SundayService>): Promise<SundayService> => {
    const response = await apiClient.put(`/sunday-services/${id}`, data);
    return extractData(response);
  },

  // Mark service as completed
  completeService: async (id: string): Promise<SundayService> => {
    const response = await apiClient.patch(`/sunday-services/${id}/complete`);
    return extractData(response);
  },

  // Delete service
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/sunday-services/${id}`);
  },

  // Get service statistics
  getServiceStats: async (): Promise<any> => {
    const response = await apiClient.get('/sunday-services/stats');
    return extractData(response);
  },
};
