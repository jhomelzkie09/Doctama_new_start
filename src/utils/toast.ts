import toast from 'react-hot-toast';

const baseStyle = {
  borderRadius: '14px',
  padding: '14px 18px',
  fontSize: '13.5px',
  fontWeight: '500',
  fontFamily: "'DM Sans', sans-serif",
  letterSpacing: '0.01em',
  lineHeight: '1.4',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
  maxWidth: '360px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

// Success toast
export const showSuccess = (message: string) => {
  toast.success(message, {
    icon: '✦',
    duration: 3000,
    style: {
      ...baseStyle,
      background: 'rgba(5, 150, 105, 0.85)',
      color: '#d1fae5',
      border: '1px solid rgba(52, 211, 153, 0.25)',
      boxShadow: '0 8px 32px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(52, 211, 153, 0.15)',
    },
  });
};

// Error toast
export const showError = (message: string) => {
  toast.error(message, {
    duration: 3000,
    style: {
      ...baseStyle,
      background: 'rgba(185, 28, 28, 0.85)',
      color: '#fee2e2',
      border: '1px solid rgba(248, 113, 113, 0.25)',
      boxShadow: '0 8px 32px rgba(185, 28, 28, 0.35), inset 0 1px 0 rgba(248, 113, 113, 0.15)',
    },
  });
};

// Warning toast
export const showWarning = (message: string) => {
  toast(message, {
    icon: '◆',
    duration: 4000,
    style: {
      ...baseStyle,
      background: 'rgba(180, 83, 9, 0.85)',
      color: '#fef3c7',
      border: '1px solid rgba(251, 191, 36, 0.25)',
      boxShadow: '0 8px 32px rgba(180, 83, 9, 0.3), inset 0 1px 0 rgba(251, 191, 36, 0.15)',
    },
  });
};

// Info toast
export const showInfo = (message: string) => {
  toast(message, {
    icon: '◉',
    duration: 3000,
    style: {
      ...baseStyle,
      background: 'rgba(29, 78, 216, 0.85)',
      color: '#dbeafe',
      border: '1px solid rgba(96, 165, 250, 0.25)',
      boxShadow: '0 8px 32px rgba(29, 78, 216, 0.3), inset 0 1px 0 rgba(96, 165, 250, 0.15)',
    },
  });
};

// Loading toast (returns toast id for dismissal)
export const showLoading = (message: string) => {
  return toast.loading(message, {
    duration: Infinity,
    style: {
      ...baseStyle,
      background: 'rgba(67, 56, 202, 0.85)',
      color: '#e0e7ff',
      border: '1px solid rgba(129, 140, 248, 0.25)',
      boxShadow: '0 8px 32px rgba(67, 56, 202, 0.3), inset 0 1px 0 rgba(129, 140, 248, 0.15)',
    },
  });
};

// Custom toast with emoji
export const showCustom = (message: string, emoji: string = '✦') => {
  toast(message, {
    icon: emoji,
    duration: 3000,
    style: {
      ...baseStyle,
      background: 'rgba(109, 40, 217, 0.85)',
      color: '#ede9fe',
      border: '1px solid rgba(167, 139, 250, 0.25)',
      boxShadow: '0 8px 32px rgba(109, 40, 217, 0.3), inset 0 1px 0 rgba(167, 139, 250, 0.15)',
    },
  });
};

// Dismiss toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};