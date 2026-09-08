import React, { useEffect, useRef } from 'react'

interface AdBannerProps {
  /** Google AdSense Publisher Client ID e.g. "ca-pub-XXXXXXXXXXXXXXXX" */
  adClient?: string
  /** Google AdSense Ad Slot ID e.g. "XXXXXXXXXX" */
  adSlot?: string
  /** Ad format (default: "auto") */
  adFormat?: 'auto' | 'horizontal' | 'rectangle'
  /** Full-width responsive layout (default: true) */
  fullWidthResponsive?: boolean
  /** Optional custom class names */
  className?: string
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({
  adClient,
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}) => {
  const adRef = useRef<HTMLModElement | null>(null)
  const isLoadedRef = useRef(false)

  const isConfigured = Boolean(adClient && adSlot)

  useEffect(() => {
    if (!isConfigured || isLoadedRef.current) return

    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
        isLoadedRef.current = true
      }
    } catch (err) {
      console.warn('AdSense initialization error:', err)
    }
  }, [isConfigured])

  if (!isConfigured) {
    return null
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto my-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center overflow-hidden text-center transition select-none ${className}`}
      aria-label="Advertisement Banner"
    >
      {/* Subtle Ad Label compliant with Google AdSense Guidelines */}
      <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mb-2">
        Advertisement
      </span>

      <ins
        ref={adRef}
        className="adsbygoogle block w-full text-center"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  )
}
