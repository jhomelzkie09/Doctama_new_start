import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import {
  Shield,
  UserCog,
  UserX,
  UserCheck,
  Search,
  Filter,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Star,
  Crown,
  Award,
  Shield as ShieldIcon,
  MoreVertical,
  RefreshCw,
  Download,
  Users,
  UserPlus,
  UserMinus,
  Key,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { User } from '../../types';

interface UserWithRole extends User {
  isAdmin?: boolean;
  roleAssignment?: {
    assignedBy: string;
    assignedAt: string;
  };
}

const AdminManagement = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      
      // Enhance user data with admin status
      const enhancedUsers = data.map(user => ({
        ...user,
        isAdmin: Array.isArray(user.roles) 
          ? user.roles.some(r => r.toLowerCase() === 'admin')
          : typeof user.roles === 'string' && user.roles.toLowerCase() === 'admin'
      }));
      
      setUsers(enhancedUsers);
    } catch (err: any) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (user: UserWithRole, makeAdmin: boolean) => {
    setActionLoading(true);
    try {
      // Get current roles
      let currentRoles: string[] = [];
      if (Array.isArray(user.roles)) {
        currentRoles = [...user.roles];
      } else if (typeof user.roles === 'string') {
        currentRoles = [user.roles];
      }
      
      // Add or remove admin role
      if (makeAdmin) {
        if (!currentRoles.includes('admin')) {
          currentRoles.push('admin');
        }
      } else {
        currentRoles = currentRoles.filter(r => r.toLowerCase() !== 'admin');
      }
      
      // Update user roles
      await userService.updateUser(user.id, { roles: currentRoles });
      
      // Update local state
      setUsers(users.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            roles: currentRoles,
            isAdmin: makeAdmin,
            roleAssignment: makeAdmin ? {
              assignedBy: currentUser?.fullName || 'Admin',
              assignedAt: new Date().toISOString()
            } : undefined
          };
        }
        return u;
      }));
      
      setSuccess(`Successfully ${makeAdmin ? 'made' : 'removed'} ${user.fullName || user.email} ${makeAdmin ? 'an admin' : 'from admin'}`);
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError('Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber?.includes(searchQuery);
    
    // Role filter
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'admin' && user.isAdmin) ||
      (roleFilter === 'user' && !user.isAdmin);
    
    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getAdminCount = () => users.filter(u => u.isAdmin).length;
  const getUserCount = () => users.filter(u => !u.isAdmin).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage administrator privileges and user roles</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Administrators</p>
              <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
            </div>
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Regular Users</p>
              <p className="text-2xl font-bold text-green-600">{getUserCount()}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.isActive).length}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Regular Users</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-lg font-medium text-gray-600">
                            {user.fullName?.charAt(0) || user.email?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.fullName || 'No name'}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {user.phoneNumber && (
                      <div className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {user.phoneNumber}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        <UserCheck className="w-3 h-3 mr-1" />
                        User
                      </span>
                    )}
                    {user.roleAssignment && user.isAdmin && (
                      <div className="text-xs text-gray-500 mt-1">
                        by {user.roleAssignment.assignedBy} on {new Date(user.roleAssignment.assignedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                      )}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  
                  <td className="px-6 py-4">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          user.isAdmin
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                    {user.id === currentUser?.id && (
                      <span className="text-sm text-gray-400 italic">Current user</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
              {filteredUsers.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Confirmation Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              {selectedUser.isAdmin ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-8 h-8 text-red-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
              )}
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {selectedUser.isAdmin ? 'Remove Admin Privileges' : 'Make User an Admin'}
              </h3>
              
              <p className="text-gray-500">
                {selectedUser.isAdmin
                  ? `Are you sure you want to remove admin privileges from ${selectedUser.fullName || selectedUser.email}?`
                  : `Are you sure you want to make ${selectedUser.fullName || selectedUser.email} an administrator?`
                }
              </p>
              
              {!selectedUser.isAdmin && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-left">
                  <p className="text-sm text-yellow-800 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Administrators have full access to manage users, orders, products, and settings.
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleAdmin(selectedUser, !selectedUser.isAdmin)}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  selectedUser.isAdmin
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Processing...' : (selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;