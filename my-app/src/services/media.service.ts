import apiClient from '@/lib/api-client';
import { Media, MediaStats, PaginatedResponse } from '@/types';

export interface MediaFilters {
  search?: string;
  type?: string;
  category?: string;
}

export const mediaService = {
  // Get all media
  getMedia: async (category?: string, page = 1, limit = 20): Promise<PaginatedResponse<Media>> => {
    const params = { category, page, limit };
    const response = await apiClient.get('/media', { params });
    return response.data;
  },

  // Get files with advanced filters
  getFiles: async (filters: MediaFilters, page = 1, limit = 20): Promise<PaginatedResponse<Media>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/media', { params });
    return response.data;
  },

  // Get media by ID
  getMediaById: async (id: string): Promise<Media> => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  // Upload single file
  uploadFile: async (file: File, category?: string): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Bulk upload files
  bulkUpload: async (files: File[], category?: string): Promise<Media[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (category) {
      formData.append('category', category);
    }

    const response = await apiClient.post('/media/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update media metadata
  updateMedia: async (id: string, data: Partial<Media>): Promise<Media> => {
    const response = await apiClient.put(`/media/${id}`, data);
    return response.data;
  },

  // Update file (alias for updateMedia)
  updateFile: async (id: string, data: Partial<Media>): Promise<Media> => {
    const response = await apiClient.put(`/media/${id}`, data);
    return response.data;
  },

  // Delete media
  deleteMedia: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  // Delete file (alias for deleteMedia)
  deleteFile: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  // Bulk delete
  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post('/media/bulk-delete', { ids });
  },

  // Download file
  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/media/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Track media view
  trackView: async (id: string): Promise<void> => {
    await apiClient.post(`/media/${id}/view`);
  },

  // Track media download
  trackDownload: async (id: string): Promise<void> => {
    await apiClient.post(`/media/${id}/download`);
  },

  // Update media permissions
  updatePermissions: async (id: string, permissions: Record<string, boolean>): Promise<Media> => {
    const response = await apiClient.patch(`/media/${id}/permissions`, { permissions });
    return response.data;
  },

  // Get media statistics
  getMediaStats: async (): Promise<MediaStats> => {
    const response = await apiClient.get('/media/stats');
    return response.data;
  },

  // Get stats (alias for getMediaStats)
  getStats: async (): Promise<MediaStats> => {
    const response = await apiClient.get('/media/stats');
    return response.data;
  },
};
