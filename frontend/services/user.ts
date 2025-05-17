import { api } from '@/lib/utils';

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  portfolio?: string;
  avatar?: File;
}

export const userService = {
  getCurrentUser: async () => {
    return api.get('/users/me');
  },

  updateProfile: async (userId: string, data: ProfileUpdateData) => {
    if (data.avatar) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.bio) formData.append('bio', data.bio);
      if (data.portfolio) formData.append('portfolio', data.portfolio);
      formData.append('avatar', data.avatar);
      
      return api.uploadForm(`/users/${userId}/profile`, formData);
    }
    
    return api.put(`/users/${userId}/profile`, data);
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string, passwordConfirm: string) => {
    return api.put(`/users/${userId}/password`, {
      currentPassword,
      newPassword,
      passwordConfirm
    });
  },

  updateRole: async (userId: string, role: 'client' | 'editor') => {
    return api.put(`/users/${userId}/role`, { role });
  }
};