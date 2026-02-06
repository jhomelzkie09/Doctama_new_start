// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[]; // Keep as array for multiple roles
  createdAt?: string;
  updatedAt?: string;
}

// Add these type helpers for better type safety
export type UserRole = 'admin' | 'user' | 'manager'; // Define possible roles

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
}

// Product types (unchanged)
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Cart types (unchanged)
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

// Order types - Updated to match your structure
export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // Made required
  userId: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // Added specific statuses
  items: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API response types - Updated to include user data structure
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  token?: string;
  user?: { // Add this structure for auth responses
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
  error?: string;
  success?: boolean;
}

// Add Auth-specific types
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