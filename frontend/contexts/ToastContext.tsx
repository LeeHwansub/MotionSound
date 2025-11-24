import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Toast, ToastType } from '../components/Toast/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const toastKey = `${type}:${message}`;
    const now = Date.now();
    const lastShown = recentToastsRef.current.get(toastKey);
    
    if (lastShown && now - lastShown < 1000) {
      return;
    }
    
    recentToastsRef.current.set(toastKey, now);
    
    setTimeout(() => {
      recentToastsRef.current.delete(toastKey);
    }, 2000);
    
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => {
      if (prev.some(t => t.message === message && t.type === type)) {
        return prev;
      }
      return [...prev, newToast];
    });

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration || 5000);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void): Promise<boolean> => {
    return new Promise((resolve) => {
      const toastId = Math.random().toString(36).substring(2, 9);
      
      const handleConfirm = () => {
        onConfirm();
        removeToast(toastId);
        resolve(true);
      };

      const handleCancel = () => {
        if (onCancel) onCancel();
        removeToast(toastId);
        resolve(false);
      };

      const confirmToast: Toast = {
        id: toastId,
        message,
        type: 'warning',
        duration: 0,
      };

      setToasts((prev) => {
        if (prev.some(t => t.id === toastId)) {
          return prev;
        }
        return [...prev, confirmToast];
      });

      setTimeout(() => {
        const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`) as HTMLElement;
        if (toastElement) {
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = `
            display: flex;
            gap: 0.5rem;
            margin-top: 0.75rem;
            justify-content: flex-end;
          `;

          const confirmButton = document.createElement('button');
          confirmButton.textContent = '확인';
          confirmButton.onclick = handleConfirm;
          confirmButton.style.cssText = `
            padding: 0.5rem 1rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
          `;

          const cancelButton = document.createElement('button');
          cancelButton.textContent = '취소';
          cancelButton.onclick = handleCancel;
          cancelButton.style.cssText = `
            padding: 0.5rem 1rem;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
          `;

          buttonContainer.appendChild(confirmButton);
          buttonContainer.appendChild(cancelButton);
          toastElement.appendChild(buttonContainer);
        }
      }, 100);
    });
  }, [removeToast]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
      }}
    >
      {children}
      {toasts.length > 0 && (
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
              <div
                data-toast-id={toast.id}
                style={{
                  position: 'relative',
                  padding: '1rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                  maxWidth: '500px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  cursor: toast.duration === 0 ? 'default' : 'pointer',
                  backgroundColor:
                    toast.type === 'success'
                      ? '#d1fae5'
                      : toast.type === 'error'
                      ? '#fee2e2'
                      : toast.type === 'warning'
                      ? '#fef3c7'
                      : '#dbeafe',
                  color:
                    toast.type === 'success'
                      ? '#065f46'
                      : toast.type === 'error'
                      ? '#dc2626'
                      : toast.type === 'warning'
                      ? '#92400e'
                      : '#1e40af',
                  border: `1px solid ${
                    toast.type === 'success'
                      ? '#10b981'
                      : toast.type === 'error'
                      ? '#ef4444'
                      : toast.type === 'warning'
                      ? '#f59e0b'
                      : '#3b82f6'
                  }`,
                  transition: 'all 0.3s ease-out',
                }}
                onClick={() => {
                  if (toast.duration !== 0) {
                    removeToast(toast.id);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{ flex: 1 }}>{toast.message}</div>
                  {toast.duration !== 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeToast(toast.id);
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

