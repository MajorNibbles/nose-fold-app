import { useState, useEffect } from 'react'
import { trackEvent } from '../utils/analytics'

const PWA_DISMISSED_KEY = 'facefold_install_dismissed_v1'

export function usePwaInstall() {
  const [showPrompt, setShowPrompt] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if already installed / running in standalone mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(standalone)
    if (standalone) return

    // 2. Detect platform
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

    // 3. Check if user previously dismissed the prompt (persistent in localStorage)
    const isDismissed = localStorage.getItem(PWA_DISMISSED_KEY) === 'true'

    // 4. Listen for Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!isDismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 5. On mobile, auto-show prompt after a short delay ONLY if NOT dismissed previously
    let timer: ReturnType<typeof setTimeout> | null = null
    if (!isDismissed && (isIos || isAndroid)) {
      timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const triggerInstall = async () => {
    trackEvent('pwa_install_clicked', { platform })
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
        trackEvent('pwa_installed')
      }
      setDeferredPrompt(null)
    } else {
      // For iOS or browsers without native prompt, display instruction sheet
      setShowPrompt(true)
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem(PWA_DISMISSED_KEY, 'true')
    trackEvent('pwa_prompt_dismissed')
  }

  return {
    showPrompt,
    isStandalone,
    platform,
    deferredPrompt,
    triggerInstall,
    dismissPrompt,
  }
}
