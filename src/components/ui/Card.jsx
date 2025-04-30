import React from 'react';

export function Card({ children, className = '', hover = false, glass = false }) {
  const baseClasses = 'rounded-2xl shadow-soft overflow-hidden';
  const hoverClasses = 'transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:shadow-blue-100/20 hover-glow';
  // Only add bg-white if no custom background is provided in className
  const hasCustomBg = className.includes('bg-');
  const glassClasses = glass ? 'glass' : (hasCustomBg ? '' : 'bg-white');

  return (
    <div className={`${baseClasses} ${hoverClasses} ${glassClasses} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function GlassCard({ children, className = '', dark = false }) {
  const glassClass = dark ? 'glass-dark text-white' : 'glass';

  return (
    <div className={`rounded-2xl shadow-soft overflow-hidden ${glassClass} ${className}`}>
      {children}
    </div>
  );
}

export function StatsCard({ title, value, icon, className = '', trend = null }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`mt-1 flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? (
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
    </Card>
  );
}
