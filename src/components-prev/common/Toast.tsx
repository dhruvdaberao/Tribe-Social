import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let toasts: ToastMessage[] = [];
const listeners: Array<(toasts: ToastMessage[]) => void> = [];

const notifyListeners = () => {
    listeners.forEach(listener => listener(toasts));
};

export const toast = {
  info: (message: string) => {
    toastId += 1;
    toasts = [...toasts, { id: toastId, message, type: 'info' }];
    notifyListeners();
  },
  success: (message: string) => {
    toastId += 1;
    toasts = [...toasts, { id: toastId, message, type: 'success' }];
    notifyListeners();
  },
  error: (message: string) => {
    toastId += 1;
    toasts = [...toasts, { id: toastId, message, type: 'error' }];
    notifyListeners();
  },
};

const ToastItem: React.FC<ToastMessage> = ({ message, type, id }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to allow enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    
    // Auto-dismiss timer
    const exitTimer = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation to finish before removing from array
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id);
        notifyListeners();
      }, 300);
    }, 3000);

    return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
    }
  }, [id]);

  const bgColor = type === 'info' ? 'bg-accent text-accent-text' : 
                  type === 'success' ? 'bg-green-500 text-white' : 
                  'bg-red-500 text-white';
  
  const icon =
    type === 'success' ? (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ) : type === 'error' ? (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ) : (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    );

  return (
    <div
      className={`w-full max-w-sm p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-all duration-300 ease-in-out transform ${bgColor} ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <p className="font-semibold text-sm">{message}</p>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>(toasts);

  const listener = useCallback((newToasts: ToastMessage[]) => {
    setCurrentToasts([...newToasts]);
  }, []);

  useEffect(() => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [listener]);

  const portalRoot = document.getElementById('root');
  if (!portalRoot) return null;

  return createPortal(
    <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
      {currentToasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} />
        </div>
      ))}
    </div>,
    portalRoot
  );
};