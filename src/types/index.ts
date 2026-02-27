// User types
export interface User {
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
  profileImage?: string;
  roles: string[] | string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export type UserRole = 'admin' | 'user' | 'manager';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
}

// Product Image type
export interface ProductImage {
  id?: number;
  imageUrl: string;
  productId?: number;
  createdAt?: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: ProductImage[];
  categoryId: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  height: number;
  width: number;
  length: number;
  colorsVariant: string[];
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[] | ProductImage[];
  categoryId: number;
  stockQuantity: number;
  height: number;
  width: number;
  length: number;
  colorsVariant: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// Category types
export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

// Cart types
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  subtotal: number;
}

export interface Cart {
  id: number;
  createdAt: string;
  itemCount: number;
  items: CartItem[];
  totalPrice: number;
}

// Payment Proof type
export interface PaymentProof {
  receiptImage: string;
  referenceNumber: string;
  senderName: string;
  paymentDate: string;
  notes?: string;
}

// Order Item types
export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  imageUrl: string;
  color?: string;
  size?: string;
}

export type PaymentMethod = 'cod' | 'gcash' | 'paymaya';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'awaiting_payment';

// MAIN Order interface
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  shippingAddress?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  paymentProof?: PaymentProof;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
  error?: string;
  success?: boolean;
}

// Auth-specific types
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  token?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Add these to your existing types after your current User interface

// ========== USER EXTENSIONS FOR CUSTOMER MANAGEMENT ==========

/**
 * Extended user statistics for admin dashboard
 */
export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  favoriteCategory?: string;
  favoriteProduct?: string;
  reviewCount: number;
  returnCount: number;
  cancellationCount: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * User with statistics (for customer list in admin)
 */
export interface UserWithStats extends User {
  stats: UserStats;
  recentOrders?: Order[];
  addressSummary?: string;
}

/**
 * User profile update DTO (for admin edits)
 */
export interface UserUpdateDto {
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
  isActive?: boolean;
  roles?: string[];
}

/**
 * Toggle user status DTO
 */
export interface ToggleUserStatusDto {
  isActive: boolean;
}

/**
 * Customer list item (simplified for tables)
 */
export interface CustomerListItem {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  lastLogin?: string;
  totalOrders?: number;
  totalSpent?: number;
  addressSummary?: string;
}

// ========== ADDRESS TYPES ==========

/**
 * Customer address (for multiple addresses per user)
 */
export interface CustomerAddress {
  id: string;
  userId: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

// ========== ACTIVITY LOG TYPES ==========

/**
 * Activity log entry for customer activity
 */
export interface ActivityLog {
  id: string;
  userId: string;
  type: 'order' | 'login' | 'profile_update' | 'password_change' | 'review' | 'support';
  description: string;
  timestamp: string;
  metadata?: any;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Helper function to get user's display name
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  
  return user.fullName || 
         `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
         user.email?.split('@')[0] || 
         'User';
};

/**
 * Helper function to get user initials for avatar
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return '?';
  
  if (user.fullName) {
    return user.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }
  
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return '?';
};

/**
 * Helper function to check if user has a specific role
 * Handles both string and array role formats
 */
export const userHasRole = (user: User | null, role: UserRole): boolean => {
  if (!user?.roles) return false;
  
  const rolesToCheck = Array.isArray(user.roles) ? user.roles : [user.roles];
  return rolesToCheck.some(r => r.toLowerCase() === role.toLowerCase());
};

/**
 * Helper function to check if user is admin
 */
export const userIsAdmin = (user: User | null): boolean => {
  return userHasRole(user, 'admin');
};

/**
 * Helper function to check if user is customer
 */
export const userIsCustomer = (user: User | null): boolean => {
  return userHasRole(user, 'user');
};

/**
 * Helper function to get user's primary role for display
 */
export const getUserPrimaryRole = (user: User | null): string => {
  if (!user?.roles) return 'Guest';
  
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  
  if (roles.some(r => r.toLowerCase() === 'admin')) return 'Admin';
  if (roles.some(r => r.toLowerCase() === 'manager')) return 'Manager';
  if (roles.some(r => r.toLowerCase() === 'user')) return 'Customer';
  
  return roles[0] || 'User';
};

/**
 * Format user address for display
 */
export const formatUserAddress = (user: User): string => {
  const parts = [
    user.address,
    user.city,
    user.state,
    user.zipCode,
    user.country
  ].filter(Boolean);
  
  return parts.join(', ');
};

/**
 * Create address summary (short version for tables)
 */
export const createAddressSummary = (user: User): string | undefined => {
  const parts = [
    user.city,
    user.state,
    user.country
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : undefined;
};

/**
 * Get user status color for badges
 */
export const getUserStatusColor = (isActive: boolean): string => {
  return isActive 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';
};

/**
 * Get email verification status color
 */
export const getEmailVerifiedColor = (verified: boolean): string => {
  return verified
    ? 'bg-blue-100 text-blue-800'
    : 'bg-yellow-100 text-yellow-800';
};

/**
 * Get role badge color
 */
export const getRoleColor = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Sort users by different criteria
 */
export const sortUsers = (
  users: User[], 
  sortBy: 'name' | 'email' | 'createdAt' | 'lastLogin' | 'orders', 
  order: 'asc' | 'desc' = 'asc'
): User[] => {
  return [...users].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = (a.fullName || '').localeCompare(b.fullName || '');
        break;
      case 'email':
        comparison = (a.email || '').localeCompare(b.email || '');
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'lastLogin':
        const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        comparison = aTime - bTime;
        break;
      default:
        comparison = 0;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filter users by search term
 */
export const filterUsersBySearch = (users: User[], searchTerm: string): User[] => {
  if (!searchTerm) return users;
  
  const term = searchTerm.toLowerCase();
  return users.filter(user => 
    user.email?.toLowerCase().includes(term) ||
    user.fullName?.toLowerCase().includes(term) ||
    user.firstName?.toLowerCase().includes(term) ||
    user.lastName?.toLowerCase().includes(term) ||
    user.phoneNumber?.includes(term) ||
    user.city?.toLowerCase().includes(term)
  );
};

/**
 * Filter users by role
 */
export const filterUsersByRole = (users: User[], role: UserRole | 'all'): User[] => {
  if (role === 'all') return users;
  
  return users.filter(user => userHasRole(user, role));
};

/**
 * Filter users by status
 */
export const filterUsersByStatus = (
  users: User[], 
  status: 'all' | 'active' | 'inactive'
): User[] => {
  if (status === 'all') return users;
  
  const isActive = status === 'active';
  return users.filter(user => user.isActive === isActive);
};

/**
 * Filter users by verification
 */
export const filterUsersByVerification = (
  users: User[],
  verified: 'all' | 'verified' | 'unverified'
): User[] => {
  if (verified === 'all') return users;
  
  const isVerified = verified === 'verified';
  return users.filter(user => user.emailConfirmed === isVerified);
};

/**
 * Calculate user statistics from orders
 */
export const calculateUserStats = (user: User, orders: Order[]): UserStats => {
  const userOrders = orders.filter(order => order.userId === user.id);
  
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  
  const cancelledOrders = userOrders.filter(order => order.status === 'cancelled').length;
  
  const sortedOrders = [...userOrders].sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
  
  return {
    totalOrders,
    totalSpent,
    averageOrderValue,
    firstOrderDate: sortedOrders[sortedOrders.length - 1]?.orderDate,
    lastOrderDate: sortedOrders[0]?.orderDate,
    favoriteCategory: 'Living Room', // This would need product category analysis
    favoriteProduct: 'Best Seller',   // This would need product analysis
    reviewCount: 0,                   // This would need review service
    returnCount: 0,                    // This would need return service
    cancellationCount: cancelledOrders,
    loyaltyTier: totalSpent > 10000 ? 'platinum' : 
                 totalSpent > 5000 ? 'gold' : 
                 totalSpent > 1000 ? 'silver' : 'bronze'
  };
};

// Add these to your index.ts exports if you want to use them
export interface UserUpdateDto {
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
  isActive?: boolean;
  roles?: string[];
}

export interface ToggleUserStatusDto {
  isActive: boolean;
}