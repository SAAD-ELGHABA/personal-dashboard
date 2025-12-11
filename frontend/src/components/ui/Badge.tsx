import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-green-600 dark:bg-green-500 text-white',
    warning: 'bg-yellow-600 dark:bg-yellow-500 text-white',
    danger: 'bg-red-600 dark:bg-red-500 text-white',
    secondary: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
