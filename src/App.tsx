import { useState, useMemo, useCallback, useEffect } from 'react'
import { Header, type AppStep } from './components/Header'
import { Step1UploadCrop } from './components/Step1UploadCrop'
import { DrawingCanvas } from './components/DrawingCanvas'
import { FoldedView } from './components/FoldedView'
import { FoldControls } from './components/FoldControls'
import { CameraCaptureModal } from './components/CameraCaptureModal'
import { PhoneConnectModal } from './components/PhoneConnectModal'
import { AddToHomePrompt } from './components/AddToHomePrompt'
import { AdBanner } from './components/AdBanner'
import { InfoSection } from './components/InfoSection'
import { Footer } from './components/Footer'
import { LegalModal, type LegalTab } from './components/LegalModal'
import type { Stroke, FoldMode } from './types/fold'
import { computeFoldMap } from './utils/curveUtils'
import { normalizeImage } from './utils/imageUtils'
import { soundManager } from './utils/soundEffects'
import { trackEvent } from './utils/analytics'
import { usePwaInstall } from './hooks/usePwaInstall'

const SESSION_STORAGE_KEY = 'nosefold_app_state_v1'

interface SavedState {
  currentStep: AppStep
  imageSrc: string
  dimensions: { width: number; height: number }
  topStroke: Stroke
  bottomStroke: Stroke
  foldMode: FoldMode
}

function loadSavedState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as SavedState
    }
  } catch (err) {
    console.warn('Could not load session state:', err)
  }
  return null
}

export function App() {
  const pwa = usePwaInstall()
  const [saved] = useState(() => loadSavedState())

  // Current active step: 1 = Photo & Crop, 2 = Draw Lines, 3 = Reveal & Download
  const [currentStep, setCurrentStep] = useState<AppStep>(saved?.currentStep ?? 1)

  // Photo state (starts empty if no saved state)
  const [imageSrc, setImageSrc] = useState<string>(saved?.imageSrc ?? '')
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(
    saved?.dimensions ?? {
      width: 500,
      height: 650,
    }
  )

  // Drawing strokes
  const [topStroke, setTopStroke] = useState<Stroke>(saved?.topStroke ?? [])
  const [bottomStroke, setBottomStroke] = useState<Stroke>(saved?.bottomStroke ?? [])
  const [foldMode, setFoldMode] = useState<FoldMode>(saved?.foldMode ?? 'full-paper')

  // Auto-save state to sessionStorage so mobile background tab switches or memory pressure never lose progress
  useEffect(() => {
    try {
      const stateToSave: SavedState = {
        currentStep,
        imageSrc,
        dimensions,
        topStroke,
        bottomStroke,
        foldMode,
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave))
    } catch {
      // Gracefully ignore if storage quota exceeded or disabled
    }
  }, [currentStep, imageSrc, dimensions, topStroke, bottomStroke, foldMode])

  // Fold animation state
  const [foldProgress, setFoldProgress] = useState<number>(1.0)
  const [showCreaseShadow, setShowCreaseShadow] = useState<boolean>(true)
  const trimToFoldHeight = true

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy')

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalTab(tab)
    setIsLegalModalOpen(true)
  }

  // Calculate the column fold map from top and bottom strokes
  const foldMap = useMemo(() => {
    return computeFoldMap(topStroke, bottomStroke, dimensions.width, foldMode)
  }, [topStroke, bottomStroke, dimensions.width, foldMode])

  const handleFileUpload = async (dataUrl: string) => {
    try {
      const norm = await normalizeImage(dataUrl, 900)
      setImageSrc(norm.dataUrl)
      setTopStroke([])
      setBottomStroke([])
    } catch {
      setImageSrc(dataUrl)
    }
    trackEvent('upload_photo', { method: 'file' })
  }

  const handleCameraCapture = async (dataUrl: string) => {
    try {
      const norm = await normalizeImage(dataUrl, 900)
      setImageSrc(norm.dataUrl)
      setTopStroke([])
      setBottomStroke([])
    } catch {
      setImageSrc(dataUrl)
    }
    trackEvent('upload_photo', { method: 'camera' })
  }

  // Sync steps with browser history for Android swipe-back gesture & system back button
  useEffect(() => {
    if (!window.history.state || window.history.state.step === undefined) {
      window.history.replaceState({ step: currentStep }, '')
    }
  }, [])

  const changeStep = useCallback((newStep: AppStep, pushHistory = true) => {
    setCurrentStep(newStep)
    if (pushHistory) {
      window.history.pushState({ step: newStep }, '')
    }
  }, [])

  // Listen for browser popstate (triggered by Android swipe-left / back gestures)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetStep = event.state?.step
      if (typeof targetStep === 'number' && (targetStep === 1 || targetStep === 2 || targetStep === 3)) {
        setCurrentStep(targetStep as AppStep)
      } else {
        // Fallback: stay inside the app rather than exiting to external sites
        setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as AppStep) : 1))
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Guard against accidental page close if lines are drawn
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (topStroke.length > 0 || bottomStroke.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [topStroke.length, bottomStroke.length])

  // Complete Step 1 and proceed to Step 2
  const handleStep1Complete = async (croppedDataUrl: string) => {
    try {
      const norm = await normalizeImage(croppedDataUrl, 850)
      setImageSrc(norm.dataUrl)
      setDimensions({ width: norm.width, height: norm.height })
    } catch {
      setImageSrc(croppedDataUrl)
    }
    soundManager.playPaperCrease()
    trackEvent('crop_complete')
    changeStep(2)
  }

  // Complete Step 2 and proceed to Step 3
  const handleStep2Complete = () => {
    soundManager.playFoldSound(true)
    setFoldProgress(1.0)
    trackEvent('fold_created')
    changeStep(3)
  }

  // Toggle Before / After in Step 3
  const handleToggleBeforeAfter = useCallback(() => {
    setFoldProgress((prev) => {
      const next = prev > 0.5 ? 0.0 : 1.0
      soundManager.playFoldSound(next > 0.5)
      return next
    })
  }, [])

  // Start fresh
  const handleRestart = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {}
    setImageSrc('')
    setTopStroke([])
    setBottomStroke([])
    setDimensions({ width: 500, height: 650 })
    changeStep(1)
  }

  const canGoToStep2 = Boolean(imageSrc && imageSrc.length > 0)
  const canGoToStep3 = topStroke.length > 1 && bottomStroke.length > 1

  return (
    <div className="min-h-screen w-full bg-[#0b0e14] text-slate-100 flex flex-col p-3 sm:p-5 antialiased selection:bg-pink-500 selection:text-white safe-area-bottom">
      {/* Header with FaceFold Logo */}
      <Header
        currentStep={currentStep}
        onStepChange={(step) => changeStep(step)}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onRestart={handleRestart}
        canGoToStep2={canGoToStep2}
        canGoToStep3={canGoToStep3}
        canInstall={!pwa.isStandalone}
        onTriggerInstall={pwa.triggerInstall}
      />

      {/* Main Content Area: Step 1, 2, or 3 */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {currentStep === 1 && (
          <Step1UploadCrop
            initialImageSrc={imageSrc}
            onTriggerCamera={() => setIsCameraOpen(true)}
            onFileUpload={handleFileUpload}
            onNext={handleStep1Complete}
          />
        )}

        {currentStep === 2 && (
          <DrawingCanvas
            imageSrc={imageSrc}
            topStroke={topStroke}
            bottomStroke={bottomStroke}
            foldMode={foldMode}
            onFoldModeChange={setFoldMode}
            onTopStrokeChange={setTopStroke}
            onBottomStrokeChange={setBottomStroke}
            onFoldReady={handleStep2Complete}
            onBack={() => changeStep(1)}
          />
        )}

        {currentStep === 3 && (
          <>
            <FoldedView
              imageSrc={imageSrc}
              foldMap={foldMap}
              foldProgress={foldProgress}
              showCreaseShadow={showCreaseShadow}
              trimToFoldHeight={trimToFoldHeight}
              onToggleBeforeAfter={handleToggleBeforeAfter}
              onFoldProgressChange={setFoldProgress}
            />
            <FoldControls
              foldProgress={foldProgress}
              onFoldProgressChange={setFoldProgress}
              onAdjustLines={() => changeStep(2)}
              onNewPhoto={() => changeStep(1)}
              imageSrc={imageSrc}
              foldMap={foldMap}
              showCreaseShadow={showCreaseShadow}
              onToggleCreaseShadow={setShowCreaseShadow}
              trimToFoldHeight={trimToFoldHeight}
            />
          </>
        )}
      </main>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Phone QR Connect Modal */}
      <PhoneConnectModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />

      {/* Add to Homepage Pop up */}
      <AddToHomePrompt
        showPrompt={pwa.showPrompt}
        platform={pwa.platform}
        deferredPrompt={pwa.deferredPrompt}
        onInstall={pwa.triggerInstall}
        onDismiss={pwa.dismissPrompt}
      />

      {/* Google AdSense Responsive Banner */}
      <AdBanner adClient="ca-pub-8578537568978893" />

      {/* SEO, AdSense Compliance, How-It-Works & FAQ Content */}
      <InfoSection
        onOpenPrivacy={() => handleOpenLegal('privacy')}
        onOpenTerms={() => handleOpenLegal('terms')}
        onOpenAbout={() => handleOpenLegal('about')}
        onOpenContact={() => handleOpenLegal('contact')}
      />

      {/* Comprehensive Footer with Legal & Contact links */}
      <Footer onOpenLegal={handleOpenLegal} />

      {/* Legal / Privacy / Terms / About Dialog Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />
    </div>
  )
}

export default App
