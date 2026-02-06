// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
}

// Product types
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
  imageUrl: string;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  token?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  error?: string;
}