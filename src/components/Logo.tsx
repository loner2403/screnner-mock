import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Bull SVG Icon */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bull Head */}
          <path 
            d="M25 45 Q20 35 15 30 Q15 25 20 25 Q25 30 30 35 L35 40 Q40 35 50 35 Q60 35 65 40 L70 35 Q75 30 80 25 Q85 25 85 30 Q80 35 75 45"
            stroke="white"
            strokeWidth="2"
            fill="white"
          />
          <path 
            d="M35 40 Q30 50 30 60 Q30 75 50 75 Q70 75 70 60 Q70 50 65 40"
            stroke="white"
            strokeWidth="2"
            fill="white"
          />
          {/* Bull Face Details */}
          <circle cx="40" cy="50" r="3" fill="#000" />
          <circle cx="60" cy="50" r="3" fill="#000" />
          <path 
            d="M45 60 Q50 65 55 60"
            stroke="#000"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Cyan Arrow */}
          <path 
            d="M75 70 L75 25 M65 35 L75 25 L85 35"
            stroke="#00bcd4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="animate-pulse-slow"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black ${textSizes[size]} text-white leading-none`}>
            BULL
            <span className="text-cyan-400">SCREEN</span>
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            Market Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
