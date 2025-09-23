import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0'
      }
    });
  },
  error: (message: string) => {
    toast.error(message, {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      style: {
        background: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca'
      }
    });
  },
  warning: (message: string) => {
    toast(message, {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      style: {
        background: '#fffbeb',
        color: '#d97706',
        border: '1px solid #fed7aa'
      }
    });
  },
  info: (message: string) => {
    toast(message, {
      icon: <Info className="w-5 h-5 text-blue-600" />,
      style: {
        background: '#eff6ff',
        color: '#2563eb',
        border: '1px solid #bfdbfe'
      }
    });
  }
};

export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500'
        }
      }}
    />
  );
};