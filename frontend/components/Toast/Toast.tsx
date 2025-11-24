import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-100px)',
      zIndex: 10000,
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
      maxWidth: '500px',
      width: '90%',
      transition: 'all 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      cursor: 'pointer',
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#d1fae5',
          color: '#065f46',
          border: '1px solid #10b981',
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #ef4444',
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #f59e0b',
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #3b82f6',
        };
    }
  };

  return (
    <div
      style={getStyles()}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
      }}
    >
      <div style={{ flex: 1 }}>{toast.message}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0',
          fontSize: '1.25rem',
          lineHeight: '1',
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, pointerEvents: 'none' }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            position: 'absolute',
            top: `${80 + index * 80}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '500px',
            padding: '0 1rem',
          }}
        >
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

