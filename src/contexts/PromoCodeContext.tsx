import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { PromoCode } from '../types';
import promoCodeService from '../services/promoCode.service';
import { useAuth } from './AuthContext';

interface PromoCodeState {
  promoCodes: PromoCode[];
  activePromoCodes: PromoCode[];
  loading: boolean;
  error: string | null;
}

type PromoCodeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROMO_CODES'; payload: PromoCode[] }
  | { type: 'SET_ACTIVE_PROMO_CODES'; payload: PromoCode[] }
  | { type: 'ADD_PROMO_CODE'; payload: PromoCode }
  | { type: 'UPDATE_PROMO_CODE'; payload: PromoCode }
  | { type: 'DELETE_PROMO_CODE'; payload: number };

interface PromoCodeContextType {
  state: PromoCodeState;
  getAllPromoCodes: () => Promise<void>;
  getActivePromoCodes: () => Promise<void>;
  createPromoCode: (data: any) => Promise<PromoCode>;
  updatePromoCode: (id: number, data: Partial<PromoCode>) => Promise<void>;
  deletePromoCode: (id: number) => Promise<void>;
  validatePromoCode: (code: string, cartTotal: number) => Promise<any>;
}

const PromoCodeContext = createContext<PromoCodeContextType | undefined>(undefined);

const initialState: PromoCodeState = {
  promoCodes: [],
  activePromoCodes: [],
  loading: false,
  error: null
};

const promoCodeReducer = (state: PromoCodeState, action: PromoCodeAction): PromoCodeState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROMO_CODES':
      return { ...state, promoCodes: action.payload, loading: false };
    case 'SET_ACTIVE_PROMO_CODES':
      return { ...state, activePromoCodes: action.payload };
    case 'ADD_PROMO_CODE':
      return { ...state, promoCodes: [action.payload, ...state.promoCodes] };
    case 'UPDATE_PROMO_CODE':
      return {
        ...state,
        promoCodes: state.promoCodes.map(pc => 
          pc.id === action.payload.id ? action.payload : pc
        )
      };
    case 'DELETE_PROMO_CODE':
      return {
        ...state,
        promoCodes: state.promoCodes.filter(pc => pc.id !== action.payload)
      };
    default:
      return state;
  }
};

export const PromoCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(promoCodeReducer, initialState);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) {
      getAllPromoCodes();
    }
    getActivePromoCodes();
  }, [user, isAdmin]);

  const getAllPromoCodes = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const promoCodes = await promoCodeService.getAllPromoCodes();
      dispatch({ type: 'SET_PROMO_CODES', payload: promoCodes });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getActivePromoCodes = async () => {
    try {
      const activePromoCodes = await promoCodeService.getActivePromoCodes();
      dispatch({ type: 'SET_ACTIVE_PROMO_CODES', payload: activePromoCodes });
    } catch (error: any) {
      console.error('Error fetching active promo codes:', error);
    }
  };

  const createPromoCode = async (data: any): Promise<PromoCode> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newPromoCode = await promoCodeService.createPromoCode(data);
      dispatch({ type: 'ADD_PROMO_CODE', payload: newPromoCode });
      return newPromoCode;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updatePromoCode = async (id: number, data: Partial<PromoCode>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updated = await promoCodeService.updatePromoCode(id, data);
      dispatch({ type: 'UPDATE_PROMO_CODE', payload: updated });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deletePromoCode = async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await promoCodeService.deletePromoCode(id);
      dispatch({ type: 'DELETE_PROMO_CODE', payload: id });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const validatePromoCode = async (code: string, cartTotal: number) => {
    const result = await promoCodeService.validatePromoCode(code, cartTotal, user?.id);
    return result;
  };

  return (
    <PromoCodeContext.Provider
      value={{
        state,
        getAllPromoCodes,
        getActivePromoCodes,
        createPromoCode,
        updatePromoCode,
        deletePromoCode,
        validatePromoCode
      }}
    >
      {children}
    </PromoCodeContext.Provider>
  );
};

export const usePromoCodes = () => {
  const context = useContext(PromoCodeContext);
  if (!context) {
    throw new Error('usePromoCodes must be used within a PromoCodeProvider');
  }
  return context;
};