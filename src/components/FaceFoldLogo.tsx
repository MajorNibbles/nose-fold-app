import React from 'react'

interface FaceFoldLogoProps {
  className?: string
  onClick?: () => void
  animated?: boolean
}

export const FaceFoldLogo: React.FC<FaceFoldLogoProps> = ({
  className = '',
  onClick,
  animated = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none group ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${className}`}
      title="FaceFold"
    >
      {/* 3D Folded Paper Icon Badge */}
      <div
        className={`relative w-10 h-10 shrink-0 transition-transform duration-300 ${
          animated ? 'group-hover:scale-105 group-hover:rotate-[-2deg]' : ''
        }`}
      >
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(236,72,153,0.35)]"
        >
          <defs>
            {/* Top Flap Gradient (Pink/Magenta) */}
            <linearGradient id="iconTopGrad" x1="0" y1="0" x2="44" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Bottom Flap Gradient (Cyan/Blue) */}
            <linearGradient id="iconBotGrad" x1="0" y1="22" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Crease Shadow */}
            <linearGradient id="creaseShadow" x1="0" y1="20" x2="0" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Top Paper Flap (Holds the Eyes) */}
          <path
            d="M 6 8 C 6 4.7 8.7 2 12 2 L 32 2 C 35.3 2 38 4.7 38 8 L 37 21 C 37 21.5 36.5 22 36 22 L 8 22 C 7.5 22 7 21.5 7 21 Z"
            fill="url(#iconTopGrad)"
          />

          {/* Eyes on Top Flap */}
          <circle cx="17" cy="12" r="2.4" fill="#ffffff" />
          <circle cx="27" cy="12" r="2.4" fill="#ffffff" />
          <circle cx="18" cy="11" r="0.9" fill="#0f172a" />
          <circle cx="28" cy="11" r="0.9" fill="#0f172a" />

          {/* Bottom Paper Flap (Holds the Smile) */}
          <path
            d="M 7 23 L 37 23 L 38 36 C 38 39.3 35.3 42 32 42 L 12 42 C 8.7 42 6 39.3 6 36 Z"
            fill="url(#iconBotGrad)"
          />

          {/* Happy Smile on Bottom Flap */}
          <path
            d="M 17 31 C 19 35 25 35 27 31"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Accordion Fold Crease Line and 3D Shadow in the middle */}
          <rect x="6" y="21" width="32" height="3" fill="url(#creaseShadow)" />
          <line
            x1="5"
            y1="22"
            x2="39"
            y2="22"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />

          {/* Accordion Side Pleats (Zigzag Paper Edges) */}
          <path
            d="M 5 6 L 8 22 L 5 38"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.6"
          />
          <path
            d="M 39 6 L 36 22 L 39 38"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* Stacked and Folded Wordmark: FACE on top, FOLD on bottom, creased together! */}
      <div
        className={`relative flex flex-col justify-center transition-transform duration-300 ${
          animated ? 'group-hover:scale-y-[0.93]' : ''
        }`}
      >
        <svg
          viewBox="0 0 116 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-auto overflow-visible"
        >
          <defs>
            {/* FACE text gradient */}
            <linearGradient id="faceWordGrad" x1="0" y1="0" x2="116" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            {/* FOLD text gradient */}
            <linearGradient id="foldWordGrad" x1="0" y1="0" x2="116" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Fold Crease Glow */}
            <linearGradient id="creaseGlow" x1="0" y1="21" x2="116" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* TOP WORD: FACE */}
          <g className="transition-transform duration-200 group-hover:translate-y-[1px]">
            <text
              x="2"
              y="18"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="19"
              letterSpacing="3.5"
              fill="url(#faceWordGrad)"
            >
              FACE
            </text>
          </g>

          {/* HORIZONTAL PAPER FOLD CREASE DIVIDER */}
          <g>
            {/* Soft dark shadow behind crease */}
            <line
              x1="0"
              y1="22.5"
              x2="106"
              y2="22.5"
              stroke="#000000"
              strokeWidth="2"
              strokeOpacity="0.6"
            />
            {/* Illuminated paper crease */}
            <line
              x1="0"
              y1="21.5"
              x2="106"
              y2="21.5"
              stroke="url(#creaseGlow)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Center Fold Pinch Icon / Diamond */}
            <path
              d="M 50 20 L 52 21.5 L 50 23 L 48 21.5 Z"
              fill="#ffffff"
              opacity="0.9"
            />
          </g>

          {/* BOTTOM WORD: FOLD */}
          <g className="transition-transform duration-200 group-hover:-translate-y-[1px]">
            <text
              x="2"
              y="39"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="19"
              letterSpacing="3.5"
              fill="url(#foldWordGrad)"
            >
              FOLD
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}

export default FaceFoldLogo
