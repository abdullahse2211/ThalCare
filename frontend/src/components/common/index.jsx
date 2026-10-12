/**
 * ThalCare Common UI Components
 */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

// ============================================
// Button Component
// ============================================
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    link: 'bg-transparent text-primary-600 hover:underline focus:ring-primary-500 p-0',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

// ============================================
// Input Component
// ============================================
export const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg',
            'transition-colors placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// ============================================
// Select Component
// ============================================
export const Select = forwardRef(({
  label,
  options = [],
  error,
  placeholder = 'Select an option',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg',
          'transition-colors focus:outline-none focus:ring-2 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-primary-500',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

// ============================================
// Textarea Component
// ============================================
export const Textarea = forwardRef(({
  label,
  error,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg',
          'transition-colors placeholder:text-gray-400 resize-none',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-primary-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ============================================
// Card Component
// ============================================
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('px-6 py-4 bg-gray-50 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================
// Badge Component
// ============================================
export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    carrier: 'bg-green-100 text-green-800',
    minor: 'bg-yellow-100 text-yellow-800',
    major: 'bg-orange-100 text-orange-800',
    severe: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ============================================
// Loading Spinner Component
// ============================================
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
        sizes[size],
        className
      )}
    />
  );
}

// ============================================
// Loading Page Component
// ============================================
export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================
// Alert Component
// ============================================
export function Alert({ variant = 'info', title, children, className = '' }) {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={cn('p-4 rounded-lg border', variants[variant], className)}>
      {title && <h4 className="font-medium mb-1">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ============================================
// Avatar Component
// ============================================
export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================
export function StatCard({ title, value, icon, trend, trendValue, className = '' }) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={cn(
              'mt-1 text-sm',
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// Export all components
export default {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Spinner,
  LoadingPage,
  EmptyState,
  Alert,
  Avatar,
  StatCard,
};
