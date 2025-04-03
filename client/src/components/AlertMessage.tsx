import React, { useEffect } from 'react';

interface AlertMessageProps {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function AlertMessage({ type, message }: AlertMessageProps) {
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [type]);

  if (!visible) return null;

  // Enhanced color classes for better visibility in both modes
  const alertClasses = {
    success: 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700',
    error: 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700',
  };

  const iconClasses = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  };

  const textClasses = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
  };

  return (
    <div className={`mt-4 p-4 rounded-md shadow-md ${alertClasses[type]}`}>
      <div className="flex items-center">
        <span className={`material-icons mr-2 ${iconClasses[type]}`}>
          {icons[type]}
        </span>
        <p className={`font-medium ${textClasses[type]}`}>{message}</p>
      </div>
    </div>
  );
}
