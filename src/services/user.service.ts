import api from '../api/config';
import { User, UserUpdateDto, ToggleUserStatusDto } from '../types';

class UserService {
  private readonly baseUrl = '/users';

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('📤 Fetching all users from admin endpoint...');
      // Note: The controller is named AdminUsers, so the route is /api/adminusers/all
      const response = await api.get('/adminusers/all');
      console.log('✅ Users fetched:', response.data);
      
      // The endpoint returns the array directly
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
      console.log(`📤 Fetching user ${id}...`);
      const response = await api.get(`/adminusers/${id}`);
      console.log('✅ User fetched:', response.data);
      
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
      console.log(`📤 Updating user ${id}...`);
      const response = await api.put(`/adminusers/${id}`, userData);
      console.log('✅ User updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating user ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      console.log(`📤 Deleting user ${id}...`);
      await api.delete(`/adminusers/${id}`);
      console.log('✅ User deleted');
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
      console.log(`📤 Toggling status for user ${id} to ${isActive ? 'active' : 'inactive'}...`);
      await api.patch(`/adminusers/${id}/toggle-status`, { isActive });
      console.log('✅ User status toggled');
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
      console.log(`📤 Fetching users with role ${role}...`);
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

      // Count by role
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