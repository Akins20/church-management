import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const hoverStyles = hoverable || onClick ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : '';

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-3 ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
