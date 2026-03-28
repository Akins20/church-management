import apiClient from '@/lib/api-client';
import { Email, EmailTemplate, PaginatedResponse } from '@/types';

export const emailService = {
  // Get all emails
  getEmails: async (page = 1, limit = 50): Promise<PaginatedResponse<Email>> => {
    const response = await apiClient.get('/emails', { params: { page, limit } });
    return response.data;
  },

  // Send individual email
  sendEmail: async (data: { to: string; subject: string; body: string }): Promise<Email> => {
    const response = await apiClient.post('/emails/send', data);
    return response.data;
  },

  // Send broadcast email
  sendBroadcast: async (data: { recipients: { email: string; name?: string }[]; subject: string; body: string }): Promise<void> => {
    await apiClient.post('/emails/broadcast', data);
  },

  // Send templated email
  sendTemplateEmail: async (data: { to: string; templateId: string; variables?: Record<string, string> }): Promise<Email> => {
    const response = await apiClient.post('/emails/template', data);
    return response.data;
  },

  // Get email statistics
  getEmailStats: async (): Promise<any> => {
    const response = await apiClient.get('/emails/stats');
    return response.data;
  },

  // Retry failed email
  retryEmail: async (emailId: string): Promise<void> => {
    await apiClient.post(`/queue/retry/${emailId}`);
  },

  // Email Templates
  getTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await apiClient.get('/email-templates');
    return response.data;
  },

  getTemplateById: async (id: string): Promise<EmailTemplate> => {
    const response = await apiClient.get(`/email-templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    const response = await apiClient.post('/email-templates', data);
    return response.data;
  },

  updateTemplate: async (id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    const response = await apiClient.put(`/email-templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/email-templates/${id}`);
  },

  previewTemplate: async (id: string, variables?: Record<string, string>): Promise<{ html: string }> => {
    const response = await apiClient.post(`/email-templates/${id}/preview`, { variables });
    return response.data;
  },
};
