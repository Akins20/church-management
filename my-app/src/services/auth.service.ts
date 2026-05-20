import apiClient, { tokenStorage } from '@/lib/api-client';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const { user, tokens } = response.data.data;

    // Store tokens
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  // Register
  register: async (data: RegisterData): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    const { user, tokens } = response.data.data;

    // Store tokens
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error);
    } finally {
      tokenStorage.clearTokens();
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data.user;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },

  // Refresh token
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const { tokens } = response.data.data;

    // Store new tokens
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

    return tokens;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },

  // Get stored tokens
  getTokens: () => ({
    accessToken: tokenStorage.getAccessToken(),
    refreshToken: tokenStorage.getRefreshToken(),
  }),
};
