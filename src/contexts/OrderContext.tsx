import React, { createContext, useContext, useReducer } from 'react';
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
  hasFetchedAllOrders: boolean;
  hasFetchedUserOrders: boolean;
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORDERS'; payload: { orders: Order[]; total: number; page: number; pages: number } }
  | { type: 'SET_ALL_ORDERS'; payload: Order[] }
  | { type: 'SET_USER_ORDERS'; payload: Order[] }
  | { type: 'SET_CURRENT_ORDER'; payload: Order | null }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'CLEAR_ORDERS' };

interface OrderContextType {
  state: OrderState;
  getUserOrders: (userId: string, forceRefresh?: boolean) => Promise<Order[]>;
  getMyOrders: (page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  getOrderById: (id: number) => Promise<Order | null>;
  createOrder: (orderData: any) => Promise<Order>;
  getAllOrders: (forceRefresh?: boolean) => Promise<Order[]>;
  updateOrderStatus: (id: number, status: string) => Promise<Order>;
  updateOrderPayment: (id: number, status: string, details?: any) => Promise<Order>;
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
  totalPages: 1,
  hasFetchedAllOrders: false,
  hasFetchedUserOrders: false
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
      
    case 'SET_ALL_ORDERS':
      return {
        ...state,
        orders: action.payload,
        totalOrders: action.payload.length,
        loading: false,
        error: null,
        hasFetchedAllOrders: true
      };
      
    case 'SET_USER_ORDERS':
      return {
        ...state,
        userOrders: action.payload,
        loading: false,
        error: null,
        hasFetchedUserOrders: true
      };
      
    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload, loading: false };
      
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          String(order.id) === String(action.payload.id) ? action.payload : order
        ),
        userOrders: state.userOrders.map(order =>
          String(order.id) === String(action.payload.id) ? action.payload : order
        ),
        currentOrder: state.currentOrder && String(state.currentOrder.id) === String(action.payload.id)
          ? action.payload
          : state.currentOrder
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
  const { user } = useAuth();

  // Get user orders by user ID
  const getUserOrders = async (userId: string, forceRefresh: boolean = false): Promise<Order[]> => {
    // Skip if already fetched and not forcing refresh
    if (state.hasFetchedUserOrders && !forceRefresh && state.userOrders.length > 0) {
      console.log('📦 User orders already fetched, skipping...');
      return state.userOrders;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const orders = await orderService.getUserOrders(userId);
      dispatch({ type: 'SET_USER_ORDERS', payload: orders });
      return orders;
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch user orders' });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Get current user's orders (paginated)
  const getMyOrders = async (page: number = 1, limit: number = 10, forceRefresh: boolean = false): Promise<void> => {
    // Skip if already fetched and not forcing refresh
    if (state.hasFetchedUserOrders && !forceRefresh && state.userOrders.length > 0) {
      console.log('📦 My orders already fetched, skipping...');
      return;
    }

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
      console.error('Error fetching orders:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch orders' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Get single order by ID
  const getOrderById = async (id: number): Promise<Order | null> => {
    // Check if we already have this order in state
    const existingOrder = state.orders.find(o => String(o.id) === String(id)) ||
      state.userOrders.find(o => String(o.id) === String(id));

    if (existingOrder) {
      dispatch({ type: 'SET_CURRENT_ORDER', payload: existingOrder });
      return existingOrder;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const order = await orderService.getOrderById(id);
      dispatch({ type: 'SET_CURRENT_ORDER', payload: order });
      return order;
    } catch (error: any) {
      console.error('Error fetching order:', error);
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
      console.error('Error creating order:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to create order' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Admin: Get all orders (ONLY when explicitly called)
  const getAllOrders = async (forceRefresh: boolean = false): Promise<Order[]> => {
    // Skip if already fetched and not forcing refresh
    if (state.hasFetchedAllOrders && !forceRefresh && state.orders.length > 0) {
      console.log('📦 All orders already fetched, skipping...');
      return state.orders;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('📦 Fetching all orders from server...');
      const orders = await orderService.getAllOrders();
      dispatch({ type: 'SET_ALL_ORDERS', payload: orders });
      return orders;
    } catch (error: any) {
      console.error('Error fetching all orders:', error);
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
      console.error('Error updating order status:', error);
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
      console.error('Error updating payment:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update payment status' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear all orders (reset fetch flags)
  const clearOrders = () => {
    dispatch({ type: 'CLEAR_ORDERS' });
  };

  // Refresh orders (force refetch)
  const refreshOrders = async () => {
    if (user && user.id) {
      await getUserOrders(user.id, true);
    }
    await getMyOrders(1, 10, true);
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