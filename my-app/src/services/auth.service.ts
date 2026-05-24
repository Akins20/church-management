import apiClient, { tokenStorage } from '@/lib/api-client';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export type LoginResult =
  | { user: User; accessToken: string; refreshToken: string }
  | { twoFactorRequired: true; challengeToken: string; email: string };

// Dev-only 2FA bypass: only set in a local .env.local, never in the prod build.
const devBypassHeaders = (): Record<string, string> => {
  const secret = process.env.NEXT_PUBLIC_DEV_2FA_SECRET;
  return secret ? { 'X-Dev-Bypass': secret } : {};
};

export const authService = {
  // Login (may return a 2FA challenge instead of tokens)
  login: async (credentials: LoginCredentials): Promise<LoginResult> => {
    const response = await apiClient.post('/auth/login', credentials, {
      headers: devBypassHeaders(),
    });
    const data = response.data.data;

    if (data?.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: data.challengeToken, email: data.email };
    }

    const { user, tokens } = data;
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },

  // Login step 2: verify the emailed code
  verifyTwoFactor: async (
    challengeToken: string,
    code: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-2fa', { challengeToken, code });
    const { user, tokens } = response.data.data;
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },

  resendTwoFactor: async (challengeToken: string): Promise<void> => {
    await apiClient.post('/auth/resend-2fa', { challengeToken });
  },

  // Settings: enable (request code -> confirm) / disable
  requestEnableTwoFactor: async (): Promise<void> => {
    await apiClient.post('/auth/2fa/request-enable');
  },
  confirmEnableTwoFactor: async (code: string): Promise<void> => {
    await apiClient.post('/auth/2fa/confirm-enable', { code });
  },
  disableTwoFactor: async (): Promise<void> => {
    await apiClient.post('/auth/2fa/disable');
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
