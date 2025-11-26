import React from 'react';

interface VerificationBadgeProps {
  isVerified?: boolean;
  verificationType?: string | null;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified = false,
  className = ''
}) => {
  if (!isVerified) return null;

  return (
    <span className={`verified-badge ${className}`}>
      <span className="verified-badge-glow" />
      <span className="verified-badge-circle">
        <svg className="verified-badge-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
        </svg>
      </span>
    </span>
  );
};
