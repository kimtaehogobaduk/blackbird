import React from 'react';

interface SmartLabLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SmartLabLogo: React.FC<SmartLabLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="SMART LAB Logo"
      >
        {/* Background base */}
        <rect width="500" height="500" fill="transparent" />

        {/* Emblem Geometry - Recreated with precision from user image */}
        <g fill="currentColor">
          {/* Outer Left Pillar */}
          <path d="M 65 50 L 125 50 L 125 350 L 65 350 Z" />

          {/* Outer Right Pillar */}
          <path d="M 375 50 L 435 50 L 435 350 L 375 350 Z" />

          {/* Bottom Framing Bar */}
          <path d="M 65 350 L 435 350 L 435 390 L 65 390 Z" />

          {/* Central Upward Apex (Inverted V / Crown Peak) */}
          <polygon points="250,75 295,145 205,145" />

          {/* Main Diagonal Bands */}
          {/* Top-Left to Bottom-Center Diagonal Stroke */}
          <polygon points="65,50 135,50 250,230 250,290 180,290 65,115" />

          {/* Top-Right to Bottom-Center Diagonal Stroke */}
          <polygon points="435,50 365,50 250,230 250,290 320,290 435,115" />

          {/* Central Lozenge Interlocking Diamond Structure */}
          <polygon points="250,155 315,225 250,295 185,225" fill="none" stroke="currentColor" strokeWidth="24" strokeLinejoin="miter" />

          {/* Bottom Inverted Triangle Support Anchor */}
          <polygon points="215,350 285,350 250,305" />

          {/* Inner 3D Shading Facet (Matching logo depth) */}
          <polygon points="250,295 210,345 250,345" opacity="0.4" />
          <polygon points="185,225 155,275 195,275" opacity="0.3" />
        </g>

        {/* Optional built-in SVG text for standalone exports */}
        <text
          x="250"
          y="465"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="52"
          letterSpacing="0.18em"
        >
          SMART LAB
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="font-extrabold tracking-wider text-slate-900 text-base font-mono">
            SMARTLAB<span className="text-indigo-600">_EXPERIMENT</span>
          </span>
          <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
            Digital Identity Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

export default SmartLabLogo;
