import { useState, useMemo, useCallback } from 'react'
import { Header } from './components/Header'
import { DrawingCanvas } from './components/DrawingCanvas'
import { FoldedView } from './components/FoldedView'
import { FoldControls } from './components/FoldControls'
import { CameraCaptureModal } from './components/CameraCaptureModal'
import { ExportModal } from './components/ExportModal'
import { PhoneConnectModal } from './components/PhoneConnectModal'
import { CropModal } from './components/CropModal'
import type { Stroke, FoldMode } from './types/fold'
import { SAMPLE_FACES, svgToDataUrl } from './utils/sampleImages'
import { computeFoldMap, generateDefaultNoseLines } from './utils/curveUtils'
import { normalizeImage } from './utils/imageUtils'
import { renderFoldedCanvas } from './utils/imageCollapse'
import { downloadFile } from './utils/gifExport'
import { soundManager } from './utils/soundEffects'
import confetti from 'canvas-confetti'
import { PenTool, CheckCircle2 } from 'lucide-react'

export function App() {
  // Default to the first sample face
  const [activeSampleId, setActiveSampleId] = useState<string | null>(SAMPLE_FACES[0].id)
  const [imageSrc, setImageSrc] = useState<string>(svgToDataUrl(SAMPLE_FACES[0].svg))
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 500,
    height: 650,
  })

  // Drawing strokes
  const [topStroke, setTopStroke] = useState<Stroke>([])
  const [bottomStroke, setBottomStroke] = useState<Stroke>([])
  const [foldMode, setFoldMode] = useState<FoldMode>('full-paper')

  // View state: 'draw' or 'folded'
  const [viewState, setViewState] = useState<'draw' | 'folded'>('draw')

  // Fold animation / scrubber state (0 = original, 1 = fully collapsed)
  const [foldProgress, setFoldProgress] = useState<number>(1.0)
  const [showCreaseShadow, setShowCreaseShadow] = useState<boolean>(true)
  const [trimToFoldHeight, setTrimToFoldHeight] = useState<boolean>(true)

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isCropOpen, setIsCropOpen] = useState(false)

  // Calculate the column fold map from top and bottom strokes
  const foldMap = useMemo(() => {
    return computeFoldMap(topStroke, bottomStroke, dimensions.width, foldMode)
  }, [topStroke, bottomStroke, dimensions.width, foldMode])

  // Select sample photo
  const handleSelectSample = (dataUrl: string, sampleId: string) => {
    setActiveSampleId(sampleId)
    setImageSrc(dataUrl)
    setDimensions({ width: 500, height: 650 })
    setTopStroke([])
    setBottomStroke([])
    setViewState('draw')
    setFoldProgress(1.0)
  }

  // Apply crop
  const handleApplyCrop = async (croppedDataUrl: string) => {
    try {
      const norm = await normalizeImage(croppedDataUrl, 900)
      setActiveSampleId(null)
      setImageSrc(norm.dataUrl)
      setDimensions({ width: norm.width, height: norm.height })
      setTopStroke([])
      setBottomStroke([])
      setViewState('draw')
      setFoldProgress(1.0)
    } catch {
      setImageSrc(croppedDataUrl)
    }
  }

  // File upload
  const handleFileUpload = async (dataUrl: string) => {
    try {
      const norm = await normalizeImage(dataUrl, 900)
      setActiveSampleId(null)
      setImageSrc(norm.dataUrl)
      setDimensions({ width: norm.width, height: norm.height })
      setTopStroke([])
      setBottomStroke([])
      setViewState('draw')
      setFoldProgress(1.0)
      setIsCropOpen(true)
    } catch {
      setActiveSampleId(null)
      setImageSrc(dataUrl)
      setIsCropOpen(true)
    }
  }

  // Camera capture
  const handleCameraCapture = async (dataUrl: string) => {
    try {
      const norm = await normalizeImage(dataUrl, 900)
      setActiveSampleId(null)
      setImageSrc(norm.dataUrl)
      setDimensions({ width: norm.width, height: norm.height })
      setTopStroke([])
      setBottomStroke([])
      setViewState('draw')
      setFoldProgress(1.0)
      setIsCropOpen(true)
    } catch {
      setActiveSampleId(null)
      setImageSrc(dataUrl)
      setIsCropOpen(true)
    }
  }

  // Auto-place squiggly fold lines on current image
  const handleAutoPlaceLines = useCallback(() => {
    // Generate default lines positioned on middle face
    const { top, bottom } = generateDefaultNoseLines(dimensions.width, dimensions.height)
    setTopStroke(top)
    setBottomStroke(bottom)
    soundManager.playPaperCrease()
  }, [dimensions.width, dimensions.height])

  // Switch to folded result view
  const handleFoldReady = () => {
    soundManager.playFoldSound(true)
    setFoldProgress(1.0)
    setViewState('folded')
  }

  // Toggle Before / After
  const handleToggleBeforeAfter = useCallback(() => {
    setFoldProgress((prev) => {
      const next = prev > 0.5 ? 0.0 : 1.0
      soundManager.playFoldSound(next > 0.5)
      return next
    })
  }, [])

  // Direct instant download of the current photo (folded or original)
  const handleDownloadFoldedImage = useCallback(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = dimensions.width
      srcCanvas.height = dimensions.height
      const srcCtx = srcCanvas.getContext('2d')
      if (!srcCtx) return
      srcCtx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

      const targetCanvas = document.createElement('canvas')
      renderFoldedCanvas(srcCtx, targetCanvas, foldMap, {
        foldProgress,
        showCreaseShadow,
        trimToFoldHeight,
      })

      const isFolded = foldProgress > 0.5
      const dataUrl = targetCanvas.toDataURL('image/png')
      downloadFile(
        dataUrl,
        `nose-fold-${isFolded ? 'folded' : 'original'}-${Date.now()}.png`
      )

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#ec4899', '#a855f7'],
      })
      soundManager.playPaperCrease()
      soundManager.vibrate(30)
    }
  }, [imageSrc, dimensions, foldMap, foldProgress, showCreaseShadow, trimToFoldHeight])

  return (
    <div className="min-h-screen w-full bg-[#0b0e14] text-slate-100 flex flex-col p-3 sm:p-5 antialiased selection:bg-pink-500 selection:text-white">
      {/* Top Navigation & Face Presets */}
      <Header
        onSelectSample={handleSelectSample}
        onTriggerCamera={() => setIsCameraOpen(true)}
        onFileUpload={handleFileUpload}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onOpenCrop={() => setIsCropOpen(true)}
        activeSampleId={activeSampleId}
      />

      {/* View Switcher Tabs (Draw vs Folded) */}
      <div className="w-full max-w-2xl mx-auto mb-3 flex items-center justify-center">
        <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 shadow-md">
          <button
            onClick={() => setViewState('draw')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              viewState === 'draw'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            1. Draw Fold Lines
          </button>
          <button
            onClick={() => {
              if (topStroke.length > 1 && bottomStroke.length > 1) {
                setViewState('folded')
              }
            }}
            disabled={topStroke.length < 2 || bottomStroke.length < 2}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              viewState === 'folded'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/20'
                : topStroke.length > 1 && bottomStroke.length > 1
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            2. Fold &amp; Before/After
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {viewState === 'draw' ? (
          <DrawingCanvas
            imageSrc={imageSrc}
            topStroke={topStroke}
            bottomStroke={bottomStroke}
            foldMode={foldMode}
            onFoldModeChange={setFoldMode}
            onTopStrokeChange={setTopStroke}
            onBottomStrokeChange={setBottomStroke}
            onFoldReady={handleFoldReady}
            onAutoPlaceLines={handleAutoPlaceLines}
            onOpenCrop={() => setIsCropOpen(true)}
          />
        ) : (
          <>
            <FoldedView
              imageSrc={imageSrc}
              foldMap={foldMap}
              foldProgress={foldProgress}
              showCreaseShadow={showCreaseShadow}
              trimToFoldHeight={trimToFoldHeight}
              onToggleBeforeAfter={handleToggleBeforeAfter}
              onFoldProgressChange={setFoldProgress}
              onOpenExport={() => setIsExportOpen(true)}
            />
            <FoldControls
              foldProgress={foldProgress}
              onFoldProgressChange={setFoldProgress}
              onEditLines={() => setViewState('draw')}
              onExportImage={handleDownloadFoldedImage}
              onExportVideo={() => setIsExportOpen(true)}
              showCreaseShadow={showCreaseShadow}
              onToggleCreaseShadow={setShowCreaseShadow}
              trimToFoldHeight={trimToFoldHeight}
              onToggleTrimHeight={setTrimToFoldHeight}
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

      {/* Export / Share Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        imageSrc={imageSrc}
        foldMap={foldMap}
        showCreaseShadow={showCreaseShadow}
        trimToFoldHeight={trimToFoldHeight}
      />

      {/* Phone QR Connect Modal */}
      <PhoneConnectModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />

      {/* Photo Crop & Frame Modal */}
      <CropModal
        isOpen={isCropOpen}
        imageSrc={imageSrc}
        onClose={() => setIsCropOpen(false)}
        onApplyCrop={handleApplyCrop}
      />

      {/* Footer credits / quick tips */}
      <footer className="w-full max-w-2xl mx-auto text-center mt-6 pt-3 border-t border-slate-850 text-slate-500 text-[11px]">
        Recreating the paper nose fold face illusion • Draw squiggly lines &amp; tap Before/After!
      </footer>
    </div>
  )
}

export default App
