import api from '../api/config';
import { User, UserUpdateDto, ToggleUserStatusDto } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  profilePicture?: string;
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

class UserService {
  private readonly baseUrl = '/users';
  private readonly adminUrl = '/adminusers';

  // ==================== PROFILE METHODS (Current User) ====================

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await api.get(`${this.baseUrl}/profile`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching profile:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const response = await api.put(`${this.baseUrl}/profile`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating profile:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File): Promise<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post(`${this.baseUrl}/profile/picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/change-password`, {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      console.error('❌ Error changing password:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get(`${this.adminUrl}/all`);
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching users:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await api.get(`${this.adminUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching user ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put(`${this.adminUrl}/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Toggle admin role (Admin only)
   */
  async toggleAdminRole(id: string, makeAdmin: boolean): Promise<any> {
    try {
      const response = await api.post(`${this.adminUrl}/${id}/toggle-admin`, { makeAdmin });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error toggling admin role:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`${this.adminUrl}/${id}`);
    } catch (error: any) {
      console.error(`❌ Error deleting user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Toggle user active status (Admin only)
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await api.patch(`${this.adminUrl}/${id}/toggle-status`, { isActive });
    } catch (error: any) {
      console.error(`❌ Error toggling user status ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get users by role (Admin only)
   */
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => {
        if (Array.isArray(user.roles)) {
          return user.roles.some(r => r.toLowerCase() === role.toLowerCase());
        }
        if (typeof user.roles === 'string') {
          return user.roles.toLowerCase() === role.toLowerCase();
        }
        return false;
      });
    } catch (error: any) {
      console.error(`❌ Error fetching users by role:`, error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get customers only (users with 'user' role)
   */
  async getCustomers(): Promise<User[]> {
    return this.getUsersByRole('user');
  }

  /**
   * Get active users
   */
  async getActiveUsers(): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.isActive);
    } catch (error: any) {
      console.error('❌ Error fetching active users:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Search users by email or name
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      const searchTerm = query.toLowerCase();
      
      return allUsers.filter(user => 
        user.email?.toLowerCase().includes(searchTerm) ||
        user.fullName?.toLowerCase().includes(searchTerm) ||
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.phoneNumber?.includes(searchTerm)
      );
    } catch (error: any) {
      console.error('❌ Error searching users:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get user statistics (number of users, active users, etc.)
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    admins: number;
    customers: number;
    managers: number;
  }> {
    try {
      const users = await this.getAllUsers();
      
      const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        verified: users.filter(u => u.emailConfirmed).length,
        unverified: users.filter(u => !u.emailConfirmed).length,
        admins: 0,
        customers: 0,
        managers: 0
      };

      users.forEach(user => {
        const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
        
        if (roles.some(r => r.toLowerCase() === 'admin')) stats.admins++;
        if (roles.some(r => r.toLowerCase() === 'user')) stats.customers++;
        if (roles.some(r => r.toLowerCase() === 'manager')) stats.managers++;
      });

      return stats;
    } catch (error: any) {
      console.error('❌ Error getting user stats:', error.response?.data || error.message);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        admins: 0,
        customers: 0,
        managers: 0
      };
    }
  }
}

const userService = new UserService();
export default userService;