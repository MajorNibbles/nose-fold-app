import React, { useState, useEffect } from 'react'
import { PlusCircle, Share, X, Smartphone } from 'lucide-react'

export const AddToHomePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) return

    // 2. Check if user dismissed it this session
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed') === 'true'
    if (isDismissed) return

    // 3. Detect platform
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua)
    const isAndroid = /android/.test(ua)

    if (isIos) {
      setPlatform('ios')
    } else if (isAndroid) {
      setPlatform('android')
    } else {
      setPlatform('other')
    }

    // 4. Capture beforeinstallprompt for Android Chrome / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Show prompt after a short pleasant delay (1.8s)
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 1800)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <aside aria-label="Add to Homepage prompt" className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl shadow-cyan-950/40 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Add to Homepage</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full font-mono">
                App
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {platform === 'ios' ? (
                <span className="flex items-center gap-1">
                  Tap <Share className="w-3 h-3 text-cyan-400 inline" /> then <strong>Add to Home Screen</strong>
                </span>
              ) : deferredPrompt ? (
                <span>Install as full-screen app on your device</span>
              ) : (
                <span>Tap <strong>⋮</strong> then <strong>Add to Home screen</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow transition active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
