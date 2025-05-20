const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  portfolio?: string;
  avatar?: File;
}

export const userService = {
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to fetch user data' };
    }
  },

  updateProfile: async (userId: string, data: ProfileUpdateData) => {
    try {
      if (data.avatar) {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.bio) formData.append('bio', data.bio);
        if (data.portfolio) formData.append('portfolio', data.portfolio);
        formData.append('avatar', data.avatar);
        
        const response = await fetch(`${API_URL}/users/${userId}/profile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData
        });
        return await response.json();
      }
      
      const response = await fetch(`${API_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to update profile' };
    }
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string, passwordConfirm: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, passwordConfirm })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to update password' };
    }
  },

  resetPassword: async (code: string, password: string, passwordConfirm: string) => {
    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, password, passwordConfirm })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to reset password' };
    }
  },

  updateRole: async (userId: string, role: 'client' | 'editor') => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ role })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to update role' };
    }
  }
};