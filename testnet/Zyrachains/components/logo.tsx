import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Zyrachain Logo Image */}
      <div className={`${sizeClasses[size]} relative`}>
        <Image
          src="/ZYRACHAIN-logo.png"
          alt="Zyrachain Logo"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className="object-contain"
        />
      </div>
      
      {showText && (
        <span className="text-sm md:text-base lg:text-lg font-bold text-foreground font-satoshi">
          Zyrachain
        </span>
      )}
    </div>
  );
};

export default Logo;
