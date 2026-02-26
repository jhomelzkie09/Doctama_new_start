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