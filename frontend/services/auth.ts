import { api } from '@/lib/utils';

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  role: 'client' | 'editor';
  profile: {
    name: string;
    bio: string;
    avatar: string;
    portfolio: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  register: async (data: RegisterData) => {
    return api.post('/users/register', data, false);
  },

  login: async (data: LoginData) => {
    return api.post('/users/login', data, false);
  },

  forgotPassword: async (email: string) => {
    return api.post('/users/forgot-password', { email }, false);
  },

  resetPassword: async (token: string, password: string, passwordConfirm: string) => {
    return api.post(`/users/reset-password/${token}`, { password, passwordConfirm }, false);
  },

  verifyEmail: async (data: { email: string; code: string }) => {
    return api.post('/users/verify-email', data, false);
  }
};