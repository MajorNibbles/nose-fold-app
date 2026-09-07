import React, { useState } from 'react'
import { FaceFoldLogo } from './FaceFoldLogo'
import { Share2 } from 'lucide-react'
import { shareFaceFoldApp } from '../utils/shareUtils'
import { soundManager } from '../utils/soundEffects'

export type AppStep = 1 | 2 | 3

interface HeaderProps {
  currentStep?: AppStep
  onStepChange?: (step: AppStep) => void
  onOpenPhoneModal?: () => void
  onRestart: () => void
  canGoToStep2?: boolean
  canGoToStep3?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onRestart }) => {
  const [toast, setToast] = useState<string | null>(null)

  const handleShare = async () => {
    soundManager.playPaperCrease()
    const res = await shareFaceFoldApp()
    if (res.success && res.method !== 'native') {
      setToast('Link copied!')
      setTimeout(() => setToast(null), 2500)
    }
  }

  return (
    <header className="w-full max-w-2xl mx-auto flex items-center justify-between py-1.5 mb-2 px-1 select-none">
      {/* FaceFold Logo on the Left */}
      <div className="flex items-center">
        <FaceFoldLogo onClick={onRestart} animated={true} />
      </div>

      {/* Top Right "Share FaceFold" Button with Little Logo Badge */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] sm:text-xs font-bold transition transform active:scale-95 cursor-pointer shadow-sm group"
          title="Share FaceFold with friends"
        >
          {/* Little logo badge */}
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-400/30 group-hover:rotate-12 transition-transform">
            <Share2 className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="font-bold tracking-tight">Share FaceFold</span>
        </button>

        {/* Small Toast Feedback */}
        {toast && (
          <div className="absolute top-full right-0 mt-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold whitespace-nowrap shadow-lg animate-fadeIn z-50">
            ✓ {toast}
          </div>
        )}
      </div>
    </header>
  )
}
