import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import {
  Shield,
  UserX,
  UserCheck,
  Search,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Crown,
  RefreshCw,
  Users,
  UserPlus
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
  
  const [admins, setAdmins] = useState<UserWithRole[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
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
      
      setAllUsers(enhancedUsers);
      // Only show admins in the main table
      setAdmins(enhancedUsers.filter(u => u.isAdmin));
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
      await userService.toggleAdminRole(user.id, makeAdmin);
      
      // Update local state
      const updateUserRole = (u: UserWithRole) => {
        if (u.id === user.id) {
          return {
            ...u,
            isAdmin: makeAdmin,
            roleAssignment: makeAdmin ? {
              assignedBy: currentUser?.fullName || 'Admin',
              assignedAt: new Date().toISOString()
            } : undefined
          };
        }
        return u;
      };
      
      setAllUsers(prev => prev.map(updateUserRole));
      setAdmins(prev => {
        if (makeAdmin) {
          const updatedUser = { ...user, isAdmin: true };
          return [...prev, updatedUser];
        } else {
          return prev.filter(u => u.id !== user.id);
        }
      });
      
      setSuccess(`Successfully ${makeAdmin ? 'added' : 'removed'} ${user.fullName || user.email} ${makeAdmin ? 'as admin' : 'from admins'}`);
      setShowConfirmModal(false);
      setShowAddAdminModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError('Failed to update user role: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Search non-admin users
  const searchableUsers = allUsers.filter(u => !u.isAdmin);
  
  const filteredSearchUsers = searchQuery === '' 
    ? [] 
    : searchableUsers.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber?.includes(searchQuery)
      ).slice(0, 5); // Limit to 5 results

  // Pagination for admins
  const totalPages = Math.ceil(admins.length / itemsPerPage);
  const paginatedAdmins = admins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <p className="text-gray-600 mt-1">Manage administrator accounts and privileges</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddAdminModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Administrators</p>
              <p className="text-3xl font-bold text-purple-600">{admins.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{allUsers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Administrators
            <span className="text-sm font-normal text-gray-500 ml-2">({admins.length} total)</span>
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrator</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {admin.profileImage ? (
                          <img src={admin.profileImage} alt={admin.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-purple-600">
                            {admin.fullName?.charAt(0) || admin.email?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{admin.fullName || 'No name'}</div>
                        <div className="text-xs text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {admin.phoneNumber && (
                      <div className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {admin.phoneNumber}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      admin.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {admin.isActive ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                      )}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {admin.roleAssignment ? (
                      <div>
                        <p>{new Date(admin.roleAssignment.assignedAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">by {admin.roleAssignment.assignedBy}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {admin.id !== currentUser?.id ? (
                      <button
                        onClick={() => {
                          setSelectedUser(admin);
                          setShowConfirmModal(true);
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg">
                        Current user
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admins.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No administrators found</h3>
            <p className="text-gray-500 mb-4">Add users as administrators to manage the system</p>
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Admin
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, admins.length)} of{' '}
              {admins.length} admins
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add Administrator</h3>
                  <p className="text-sm text-gray-500">Search for a user to grant admin privileges</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  autoFocus
                />
              </div>
              
              {/* Search Results */}
              {searchQuery.trim() !== '' && (
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {filteredSearchUsers.length > 0 ? (
                    filteredSearchUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {user.profileImage ? (
                                <img src={user.profileImage} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-gray-600">
                                  {user.fullName?.charAt(0) || user.email?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.fullName || 'No name'}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              {user.phoneNumber && (
                                <p className="text-xs text-gray-400 mt-0.5">{user.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No users found</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected User */}
              {selectedUser && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-2">Selected User</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {selectedUser.fullName?.charAt(0) || selectedUser.email?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.fullName || 'No name'}</p>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear selection
                  </button>
                </div>
              )}
              
              {/* Warning */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Administrators have full access to manage users, orders, products, and system settings.
                  </span>
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setSearchQuery('');
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedUser) {
                    setShowConfirmModal(true);
                  }
                }}
                disabled={!selectedUser || actionLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-purple-200"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
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
                {selectedUser.isAdmin ? 'Remove Administrator?' : 'Add Administrator?'}
              </h3>
              
              <p className="text-gray-500 text-sm">
                {selectedUser.isAdmin
                  ? `Are you sure you want to remove admin privileges from ${selectedUser.fullName || selectedUser.email}?`
                  : `Are you sure you want to grant admin privileges to ${selectedUser.fullName || selectedUser.email}?`
                }
              </p>
              
              {!selectedUser.isAdmin && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg text-left">
                  <p className="text-xs text-amber-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      This user will have full access to manage all aspects of the system.
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleAdmin(selectedUser, !selectedUser.isAdmin)}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors shadow-sm ${
                  selectedUser.isAdmin
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                } disabled:opacity-50`}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  selectedUser.isAdmin ? 'Remove Admin' : 'Add Admin'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;