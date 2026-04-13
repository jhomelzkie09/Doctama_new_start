import toast from 'react-hot-toast';

// Success toast
export const showSuccess = (message: string) => {
  toast.success(message, {
    icon: '🎉',
    duration: 3000,
    style: {
      background: '#10b981',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

// Error toast
export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    style: {
      background: '#ef4444',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

// Warning toast
export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#f59e0b',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

// Info toast
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    style: {
      background: '#3b82f6',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

// Loading toast (returns toast id for dismissal)
export const showLoading = (message: string) => {
  return toast.loading(message, {
    duration: Infinity,
    style: {
      background: '#6366f1',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

// Custom toast with emoji
export const showCustom = (message: string, emoji: string = '✨') => {
  toast(message, {
    icon: emoji,
    duration: 3000,
    style: {
      background: '#8b5cf6',
      color: '#fff',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

// Dismiss toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};