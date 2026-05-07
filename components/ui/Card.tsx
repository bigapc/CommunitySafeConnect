import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-neutral-200',
      elevated: 'bg-white shadow-elevation hover:shadow-elevated transition-shadow',
      outline: 'bg-transparent border-2 border-blue-600',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-6 transition-all',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
