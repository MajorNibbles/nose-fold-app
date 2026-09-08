import React, { useRef, useEffect, useState } from 'react'
import type { ColumnFoldMap } from '../types/fold'
import { renderFoldedCanvas } from '../utils/imageCollapse'
import { soundManager } from '../utils/soundEffects'
import { downloadFile, drawFaceFoldWatermark } from '../utils/gifExport'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  Check,
  Eye,
  Sliders,
  Film,
} from 'lucide-react'

interface FoldedViewProps {
  imageSrc: string
  foldMap: ColumnFoldMap
  foldProgress: number
  showCreaseShadow: boolean
  trimToFoldHeight: boolean
  onToggleBeforeAfter: () => void
  onFoldProgressChange: (progress: number) => void
  onOpenExport?: () => void
}

export const FoldedView: React.FC<FoldedViewProps> = ({
  imageSrc,
  foldMap,
  foldProgress,
  showCreaseShadow,
  trimToFoldHeight,
  onToggleBeforeAfter,
  onFoldProgressChange,
  onOpenExport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string>('4 / 5')

  // Cache source image on an offscreen canvas
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = img.naturalWidth || 600
      srcCanvas.height = img.naturalHeight || 600
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`)
      }
      const ctx = srcCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, srcCanvas.width, srcCanvas.height)
        sourceCanvasRef.current = srcCanvas
        setIsLoaded(true)
      }
    }
  }, [imageSrc])

  // Re-render folded canvas on any parameter change
  useEffect(() => {
    if (!isLoaded || !sourceCanvasRef.current) return
    const srcCtx = sourceCanvasRef.current.getContext('2d')
    if (!srcCtx) return

    // Render normal canvas
    if (canvasRef.current) {
      renderFoldedCanvas(srcCtx, canvasRef.current, foldMap, {
        foldProgress,
        showCreaseShadow,
        trimToFoldHeight,
      })
    }

    // Render fullscreen canvas if open
    if (fullscreenCanvasRef.current) {
      renderFoldedCanvas(srcCtx, fullscreenCanvasRef.current, foldMap, {
        foldProgress,
        showCreaseShadow,
        trimToFoldHeight,
      })
    }
  }, [isLoaded, foldMap, foldProgress, showCreaseShadow, trimToFoldHeight, isFullscreen])

  // Listen to browser fullscreen change event (e.g. user pressed Escape)
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
    }
  }, [])

  // Quick 1-click Download
  const handleQuickDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const activeCanvas = fullscreenCanvasRef.current || canvasRef.current
    if (!activeCanvas) return

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = activeCanvas.width
    exportCanvas.height = activeCanvas.height
    const expCtx = exportCanvas.getContext('2d')
    if (!expCtx) return

    expCtx.drawImage(activeCanvas, 0, 0)
    drawFaceFoldWatermark(expCtx, 16, 16)

    const dataUrl = exportCanvas.toDataURL('image/png')
    downloadFile(dataUrl, `facefold-${Date.now()}.png`)

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#06b6d4', '#ec4899', '#a855f7'],
    })
    soundManager.playPaperCrease()
    soundManager.vibrate(30)

    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 2000)
  }

  // Toggle Full Screen
  const handleToggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const next = !isFullscreen
    setIsFullscreen(next)

    if (next) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    }
    soundManager.vibrate(20)
  }

  const handleCanvasClick = () => {
    soundManager.vibrate(20)
    onToggleBeforeAfter()
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto select-none px-2 sm:px-0">
      {/* Visual Canvas Container - Responsively sized to image aspect ratio with dynamic height ceiling */}
      <div
        onClick={handleCanvasClick}
        className="relative w-full max-w-full bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center cursor-pointer group mx-auto"
        style={{
          aspectRatio,
          maxHeight: 'min(53dvh, 530px)',
          touchAction: 'none',
          overscrollBehavior: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain transition-transform duration-75"
        />

        {/* Top-Right: FaceFold.app badge & Fullscreen Button */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2 z-10">
          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white/90 border border-white/10 shadow-lg flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>FaceFold.app</span>
          </div>
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 sm:p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition active:scale-95 cursor-pointer"
            title="Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FULLSCREEN PRESENTATION OVERLAY MODE */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 select-none overflow-hidden"
          onClick={handleCanvasClick}
        >
          {/* Top Bar */}
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between z-10">
            {/* Minimal Brand indicator */}
            <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900/90 text-white border border-slate-700/80 shadow-xl flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>FaceFold.app</span>
            </div>

            {/* Actions: GIF, Download & Close */}
            <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              {onOpenExport && (
                <button
                  onClick={onOpenExport}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-xl active:scale-95 transition cursor-pointer"
                  title="Export GIF or Photo"
                >
                  <Film className="w-4 h-4" />
                  <span>Get GIF</span>
                </button>
              )}

              <button
                onClick={handleQuickDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-xl active:scale-95 transition cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 shadow-xl active:scale-95 transition cursor-pointer"
                title="Exit Full Screen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Viewport */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-0">
            <canvas
              ref={fullscreenCanvasRef}
              className="max-h-[78vh] max-w-full object-contain cursor-pointer drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Bottom Bar: Quick Controls */}
          <div
            className="w-full max-w-lg mx-auto flex flex-col items-center gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Fullscreen Scrubber */}
            <div className="w-full flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl">
              <Sliders className="w-4 h-4 text-pink-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={foldProgress}
                onChange={(e) => onFoldProgressChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <button
                onClick={onToggleBeforeAfter}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 shrink-0 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Flip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
