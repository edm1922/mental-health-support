import React from 'react';
import Link from 'next/link';

export function Button({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  href, 
  onClick,
  disabled = false,
  type = 'button',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  ...props 
}) {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'text-primary-600 hover:text-primary-700 underline focus:ring-primary-500 p-0',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };
  
  // Disabled classes
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Icon classes
  const iconClasses = icon ? (iconPosition === 'left' ? 'flex-row' : 'flex-row-reverse') : '';
  const iconSpacing = icon ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : '';
  
  // Loading state
  const loadingElement = loading ? (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ) : null;
  
  // Combine all classes
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${widthClass} ${iconClasses} ${className}`;
  
  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {loadingElement}
        {icon && iconPosition === 'left' && <span className={iconSpacing}>{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className={iconSpacing}>{icon}</span>}
      </Link>
    );
  }
  
  // Otherwise render as button
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loadingElement}
      {icon && iconPosition === 'left' && <span className={iconSpacing}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className={iconSpacing}>{icon}</span>}
    </button>
  );
}

export function ButtonGroup({ children, className = '', vertical = false }) {
  const orientation = vertical ? 'flex-col' : 'flex-row';
  
  return (
    <div className={`flex ${orientation} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        // Add specific border radius based on position
        let position = '';
        if (vertical) {
          if (index === 0) position = 'rounded-b-none';
          else if (index === React.Children.count(children) - 1) position = 'rounded-t-none';
          else position = 'rounded-none';
        } else {
          if (index === 0) position = 'rounded-r-none';
          else if (index === React.Children.count(children) - 1) position = 'rounded-l-none';
          else position = 'rounded-none';
        }
        
        // Add negative margin to overlap borders
        const margin = index !== 0 ? (vertical ? '-mt-px' : '-ml-px') : '';
        
        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${position} ${margin} relative z-0 hover:z-10`,
        });
      })}
    </div>
  );
}
