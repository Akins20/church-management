import apiClient from '@/lib/api-client';
import { Department, PaginatedResponse } from '@/types';

export const departmentService = {
  // Get all departments
  getDepartments: async (page = 1, limit = 20): Promise<PaginatedResponse<Department>> => {
    const response = await apiClient.get('/departments', { params: { page, limit } });
    return response.data;
  },

  // Get department by ID
  getDepartmentById: async (id: string): Promise<Department> => {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  // Create department
  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },

  // Update department
  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await apiClient.put(`/departments/${id}`, data);
    return response.data;
  },

  // Update department budget
  updateBudget: async (id: string, budget: number, budgetUsed: number): Promise<Department> => {
    const response = await apiClient.patch(`/departments/${id}/budget`, { budget, budgetUsed });
    return response.data;
  },

  // Delete department
  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },

  // Get department statistics
  getDepartmentStats: async (): Promise<any> => {
    const response = await apiClient.get('/departments/stats');
    return response.data;
  },
};
