import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import orderService from '../services/order.service';
import { Order } from '../types';

interface OrderState {
  orders: Order[];
  userOrders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  totalOrders: number;
  currentPage: number;
  totalPages: number;
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORDERS'; payload: { orders: Order[]; total: number; page: number; pages: number } }
  | { type: 'SET_USER_ORDERS'; payload: Order[] }
  | { type: 'SET_CURRENT_ORDER'; payload: Order | null }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'CLEAR_ORDERS' };

interface OrderContextType {
  state: OrderState;
  // User methods
  getUserOrders: (userId: string) => Promise<Order[]>;
  getMyOrders: (page?: number, limit?: number) => Promise<void>;
  getOrderById: (id: number) => Promise<Order | null>;
  createOrder: (orderData: any) => Promise<Order>;
  
  // Admin methods
  getAllOrders: () => Promise<Order[]>;
  updateOrderStatus: (id: number, status: string) => Promise<Order>;
  updateOrderPayment: (id: number, status: string, details?: any) => Promise<Order>;
  
  // Utility
  clearOrders: () => void;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const initialState: OrderState = {
  orders: [],
  userOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
  totalOrders: 0,
  currentPage: 1,
  totalPages: 1
};

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload.orders,
        totalOrders: action.payload.total,
        currentPage: action.payload.page,
        totalPages: action.payload.pages,
        loading: false,
        error: null
      };
    
    case 'SET_USER_ORDERS':
      return {
        ...state,
        userOrders: action.payload,
        loading: false,
        error: null
      };
    
    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload, loading: false };
    
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
        userOrders: state.userOrders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
        currentOrder: state.currentOrder?.id === action.payload.id ? action.payload : state.currentOrder
      };
    
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        userOrders: [action.payload, ...state.userOrders]
      };
    
    case 'CLEAR_ORDERS':
      return initialState;
    
    default:
      return state;
  }
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load user orders when user logs in
  useEffect(() => {
    if (user && user.id) {
      getUserOrders(user.id);
    } else {
      dispatch({ type: 'CLEAR_ORDERS' });
    }
  }, [user?.id]);

  // Get user orders by user ID
  const getUserOrders = async (userId: string): Promise<Order[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const orders = await orderService.getUserOrders(userId);
      dispatch({ type: 'SET_USER_ORDERS', payload: orders });
      return orders;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch user orders' });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Get current user's orders (paginated)
  const getMyOrders = async (page: number = 1, limit: number = 10): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await orderService.getMyOrders(page, limit);
      dispatch({ 
        type: 'SET_ORDERS', 
        payload: {
          orders: result.orders,
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch orders' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Get single order by ID
  const getOrderById = async (id: number): Promise<Order | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const order = await orderService.getOrderById(id);
      dispatch({ type: 'SET_CURRENT_ORDER', payload: order });
      return order;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch order' });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Create new order
  const createOrder = async (orderData: any): Promise<Order> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newOrder = await orderService.createOrder(orderData);
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      return newOrder;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to create order' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Admin: Get all orders
  const getAllOrders = async (): Promise<Order[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const orders = await orderService.getAllOrders();
      dispatch({ type: 'SET_ORDERS', payload: { orders, total: orders.length, page: 1, pages: 1 } });
      return orders;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch all orders' });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Admin: Update order status
  const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedOrder = await orderService.updateOrderStatus(id, status);
      dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
      return updatedOrder;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update order status' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Admin: Update order payment
  const updateOrderPayment = async (id: number, status: string, details?: any): Promise<Order> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedOrder = await orderService.updateOrderPayment(id, status, details);
      dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
      return updatedOrder;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update payment status' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear all orders
  const clearOrders = () => {
    dispatch({ type: 'CLEAR_ORDERS' });
  };

  // Refresh orders
  const refreshOrders = async () => {
    if (user && user.id) {
      await getUserOrders(user.id);
    }
    await getMyOrders();
  };

  return (
    <OrderContext.Provider
      value={{
        state,
        getUserOrders,
        getMyOrders,
        getOrderById,
        createOrder,
        getAllOrders,
        updateOrderStatus,
        updateOrderPayment,
        clearOrders,
        refreshOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};