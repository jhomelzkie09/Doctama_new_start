import toast from 'react-hot-toast';

// Success toast
export const showSuccess = (message: string) => {
  toast.success(message, {
    icon: '🎉',
    duration: 3000,
  });
};

// Error toast
export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
  });
};

// Info toast
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
  });
};

// Loading toast (returns toast id)
export const showLoading = (message: string) => {
  return toast.loading(message, {
    duration: Infinity,
  });
};

// Custom toast with emoji
export const showCustom = (message: string, emoji: string = '✨') => {
  toast(message, {
    icon: emoji,
    duration: 3000,
  });
};

// Dismiss toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};