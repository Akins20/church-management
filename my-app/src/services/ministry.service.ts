import apiClient from '@/lib/api-client';
import { Ministry, PaginatedResponse } from '@/types';

// Helper to extract data from API response - handles multiple nesting levels
const extractData = <T>(response: any): T => {
  // Level 1: response.data
  let data = response?.data;

  // Level 2: response.data.data
  if (data && typeof data === 'object' && 'data' in data) {
    data = data.data;
  }

  return data;
};

export const ministryService = {
  // Get all ministries
  getMinistries: async (page = 1, limit = 20): Promise<PaginatedResponse<Ministry>> => {
    const response = await apiClient.get('/ministries', { params: { page, limit } });

    // Debug: Log the raw response
    console.log('Raw API response:', response);
    console.log('Response data:', response?.data);

    // Try different extraction methods
    let ministriesArray: Ministry[] = [];

    // Extract ministries array from various response shapes
    if (Array.isArray(response?.data?.data?.ministries)) {
      ministriesArray = response.data.data.ministries;
    } else if (Array.isArray(response?.data?.ministries)) {
      ministriesArray = response.data.ministries;
    } else if (Array.isArray(response?.data?.data)) {
      ministriesArray = response.data.data;
    } else if (Array.isArray(response?.data)) {
      ministriesArray = response.data;
    }

    console.log('Extracted ministries array:', ministriesArray);

    return {
      data: ministriesArray,
      total: ministriesArray.length,
      page: 1,
      limit: ministriesArray.length || 20,
      totalPages: 1,
    };
  },

  // Get ministry by ID
  getMinistryById: async (id: string): Promise<Ministry> => {
    const response = await apiClient.get(`/ministries/${id}`);
    return extractData(response);
  },

  // Create ministry
  createMinistry: async (data: Partial<Ministry>): Promise<Ministry> => {
    const response = await apiClient.post('/ministries', data);
    return extractData(response);
  },

  // Update ministry
  updateMinistry: async (id: string, data: Partial<Ministry>): Promise<Ministry> => {
    const response = await apiClient.put(`/ministries/${id}`, data);
    return extractData(response);
  },

  // Delete ministry
  deleteMinistry: async (id: string): Promise<void> => {
    await apiClient.delete(`/ministries/${id}`);
  },

  // Join ministry
  joinMinistry: async (id: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/join`);
  },

  // Leave ministry
  leaveMinistry: async (id: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/leave`);
  },

  // Add member to ministry
  addMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/members`, { userId });
  },

  // Remove member from ministry
  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/ministries/${id}/members/${userId}`);
  },

  // Get ministry statistics
  getMinistryStats: async (): Promise<any> => {
    const response = await apiClient.get('/ministries/stats');
    return extractData(response);
  },
};
