import api from '../api/config';


export {};
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  profileImage?: string;
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface UpdateUserData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  profileImage?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
}

class UserService {
  private readonly baseUrl = '/users';

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<UserProfile[]> {
  try {
    console.log('📤 Fetching all users...');
    const response = await api.get(`${this.baseUrl}/admin/users`);
    console.log('✅ Users fetched:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data.users && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    
    return [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Users endpoint not available yet, using mock data');
      // Return mock users for development
      return [
        {
          id: '1',
          email: 'admin@doctama.com',
          fullName: 'Admin User',
          roles: ['Admin'],
          isActive: true,
          emailConfirmed: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'user@example.com',
          fullName: 'Test User',
          roles: ['User'],
          isActive: true,
          emailConfirmed: true,
          createdAt: new Date().toISOString()
        }
      ] as UserProfile[];
    }
    console.error('❌ Error fetching users:', error.response?.data || error.message);
    return [];
  }
}

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      console.log(`📤 Fetching user ${id}...`);
      const response = await api.get(`${this.baseUrl}/${id}`);
      console.log('✅ User fetched:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching user ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      console.log('📤 Fetching current user profile...');
      const response = await api.get(`${this.baseUrl}/profile`);
      console.log('✅ Current user fetched:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Error fetching current user:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateUserData): Promise<UserProfile | null> {
    try {
      console.log('📤 Updating user profile...', data);
      const response = await api.put(`${this.baseUrl}/profile`, data);
      console.log('✅ Profile updated:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Error updating profile:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create new user (Admin only)
   */
  async createUser(userData: CreateUserData): Promise<UserProfile> {
    try {
      console.log('📤 Creating new user...', userData);
      const response = await api.post(`${this.baseUrl}/admin/users`, userData);
      console.log('✅ User created:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('❌ Error creating user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(id: string, userData: Partial<CreateUserData>): Promise<UserProfile> {
    try {
      console.log(`📤 Updating user ${id}...`, userData);
      const response = await api.put(`${this.baseUrl}/admin/users/${id}`, userData);
      console.log('✅ User updated:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`❌ Error updating user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log(`📤 Deleting user ${id}...`);
      await api.delete(`${this.baseUrl}/admin/users/${id}`);
      console.log(`✅ User ${id} deleted`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error deleting user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Change user role (Admin only)
   */
  async changeUserRole(id: string, role: string): Promise<UserProfile> {
    try {
      console.log(`📤 Changing role for user ${id} to ${role}...`);
      const response = await api.patch(`${this.baseUrl}/admin/users/${id}/role`, { role });
      console.log('✅ User role changed:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`❌ Error changing role for user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Toggle user active status (Admin only)
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<UserProfile> {
    try {
      console.log(`📤 Toggling status for user ${id} to ${isActive ? 'active' : 'inactive'}...`);
      const response = await api.patch(`${this.baseUrl}/admin/users/${id}/status`, { isActive });
      console.log('✅ User status toggled:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`❌ Error toggling status for user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
  }> {
    try {
      console.log('📤 Fetching user statistics...');
      const response = await api.get(`${this.baseUrl}/admin/users/stats`);
      console.log('✅ User stats fetched:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      // Return default stats if endpoint doesn't exist
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        usersByRole: {}
      };
    } catch (error: any) {
      console.error('❌ Error fetching user stats:', error.response?.data || error.message);
      // Return default stats
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        usersByRole: {}
      };
    }
  }

  /**
   * Search users (Admin only)
   */
  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      console.log(`📤 Searching users with query: ${query}...`);
      const response = await api.get(`${this.baseUrl}/admin/users/search`, {
        params: { q: query }
      });
      console.log('✅ Users search results:', response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Error searching users:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      console.log('📤 Changing password...');
      await api.post(`${this.baseUrl}/change-password`, {
        currentPassword,
        newPassword
      });
      console.log('✅ Password changed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error changing password:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      console.log(`📤 Requesting password reset for ${email}...`);
      await api.post(`${this.baseUrl}/forgot-password`, { email });
      console.log('✅ Password reset requested');
      return true;
    } catch (error: any) {
      console.error('❌ Error requesting password reset:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      console.log('📤 Resetting password...');
      await api.post(`${this.baseUrl}/reset-password`, {
        token,
        newPassword
      });
      console.log('✅ Password reset successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error resetting password:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      console.log('📤 Uploading profile image...');
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post(`${this.baseUrl}/profile/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Profile image uploaded:', response.data);
      
      if (response.data.imageUrl) {
        return response.data.imageUrl;
      } else if (response.data.url) {
        return response.data.url;
      }
      
      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('❌ Error uploading profile image:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Create and export a single instance
const userService = new UserService();
export default userService;