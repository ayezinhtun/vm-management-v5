import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  error = false, 
  className = '', 
  ...props 
}) => {
  return (
    <input
      className={`
        w-full px-3 py-2 border rounded-lg text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-colors duration-200
        ${error 
          ? 'border-red-300 bg-red-50' 
          : 'border-gray-300 bg-white hover:border-gray-400'
        }
        ${className}
      `}
      {...props}
    />
  );
};