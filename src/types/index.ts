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
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

// Add these type helpers for better type safety
export type UserRole = 'admin' | 'user' | 'manager';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
}

// Product types - CLEANED VERSION with only what your backend uses
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string; // Main/thumbnail image
  images: string[]; // Array of additional images
  categoryId: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  
  // From your backend Product model
  height: number;
  width: number;
  length: number;
  colorsVariant: string[]; // Array of available colors
  
  // Optional fields that might come from API
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  categoryId: number;
  stockQuantity: number;
  
  // From your backend
  height: number;
  width: number;
  length: number;
  colorsVariant: string[];
  
  // Status
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

// Order types
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

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
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