import apiClient from '@/lib/api-client';
import { User, UserFilters, PaginatedResponse, UserRole, MembershipStatus } from '@/types';

export const userService = {
  // Get all users with filters
  getUsers: async (filters?: UserFilters, page = 1, limit = 20): Promise<PaginatedResponse<User>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Get user directory
  getDirectory: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/directory');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData);
    // Handle nested response structure
    const data = response.data;
    if (data?.data) {
      return data.data;
    }
    return data;
  },

  // Update user role
  updateUserRole: async (id: string, role: UserRole): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Update membership status
  updateMembershipStatus: async (id: string, status: MembershipStatus): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/membership-status`, { status });
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Get user statistics
  getUserStats: async (): Promise<any> => {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },
};
