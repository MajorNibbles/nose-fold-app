import React, { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Sliders,
  Download,
  Copy,
  Check,
  RotateCcw,
  Layers,
  Film,
  Repeat,
  Columns,
  Loader2,
  ArrowLeft,
  ChevronDown,
  Share2,
} from 'lucide-react'
import { soundManager } from '../utils/soundEffects'
import confetti from 'canvas-confetti'
import type { ColumnFoldMap } from '../types/fold'
import {
  downloadFile,
  createTransitionGIF,
  createBeforeAfterSnapGIF,
  createSideBySideSnapshot,
  drawFaceFoldWatermark,
} from '../utils/gifExport'
import { renderFoldedCanvas } from '../utils/imageCollapse'

interface FoldControlsProps {
  foldProgress: number
  onFoldProgressChange: (progress: number) => void
  onAdjustLines: () => void
  onNewPhoto: () => void
  imageSrc: string
  foldMap: ColumnFoldMap
  showCreaseShadow: boolean
  onToggleCreaseShadow: (val: boolean) => void
  trimToFoldHeight?: boolean
}

export const FoldControls: React.FC<FoldControlsProps> = ({
  foldProgress,
  onFoldProgressChange,
  onAdjustLines,
  onNewPhoto,
  imageSrc,
  foldMap,
  showCreaseShadow,
  onToggleCreaseShadow,
  trimToFoldHeight = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)

  // Export states
  const [isExportingTransition, setIsExportingTransition] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)

  const [isExportingSnap, setIsExportingSnap] = useState(false)
  const [snapProgress, setSnapProgress] = useState(0)

  const [copied, setCopied] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [isDownloadExpanded, setIsDownloadExpanded] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  const isExpanded = isDownloadExpanded || isExportingTransition || isExportingSnap

  // Confetti celebration on entering reveal view
  useEffect(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#ec4899', '#a855f7'],
    })
  }, [])

  // Accordion flap bounce loop
  useEffect(() => {
    if (!isPlaying) return

    let animationFrameId: number
    let startTime: number | null = null
    const periodMs = 1100

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const phase = (elapsed % periodMs) / periodMs
      const progress = 0.5 * (1 - Math.cos(phase * Math.PI * 2))
      onFoldProgressChange(progress)

      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, onFoldProgressChange])

  // Helper to load source image on canvas
  const getSourceCanvas = async (): Promise<HTMLCanvasElement> => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    if (!img.complete) {
      await new Promise((resolve) => (img.onload = resolve))
    }
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 600
    canvas.height = img.naturalHeight || 600
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0)
    }
    return canvas
  }

  // 1. Export Transition GIF
  const handleExportTransitionGIF = async () => {
    setIsExportingTransition(true)
    setTransitionProgress(10)
    try {
      const srcCanvas = await getSourceCanvas()
      const blob = await createTransitionGIF(
        srcCanvas,
        foldMap,
        { showCreaseShadow, trimToFoldHeight: false, anchorTop: true, targetWidth: 360 },
        (pct) => setTransitionProgress(pct)
      )
      downloadFile(blob, `facefold-loop-${Date.now()}.gif`)
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
      soundManager.playFoldSound(true)
    } finally {
      setIsExportingTransition(false)
    }
  }

  // 2. Export Before & After Snap GIF
  const handleExportSnapGIF = async () => {
    setIsExportingSnap(true)
    setSnapProgress(20)
    try {
      const srcCanvas = await getSourceCanvas()
      const blob = await createBeforeAfterSnapGIF(
        srcCanvas,
        foldMap,
        { showCreaseShadow, trimToFoldHeight: false, anchorTop: true, targetWidth: 380 },
        (pct) => setSnapProgress(pct)
      )
      downloadFile(blob, `facefold-snap-${Date.now()}.gif`)
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
      soundManager.playPaperCrease()
    } finally {
      setIsExportingSnap(false)
    }
  }

  // 3. Export Side-by-Side Split Photo
  const handleExportSideBySide = async () => {
    const srcCanvas = await getSourceCanvas()
    const compCanvas = createSideBySideSnapshot(srcCanvas, foldMap, {
      showCreaseShadow,
      trimToFoldHeight,
    })
    const dataUrl = compCanvas.toDataURL('image/png')
    downloadFile(dataUrl, `facefold-split-${Date.now()}.png`)
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
    soundManager.playPaperCrease()
  }

  // 4. Save Single Picture (PNG)
  const handleDownloadImage = async () => {
    const srcCanvas = await getSourceCanvas()
    const canvas = document.createElement('canvas')
    const srcCtx = srcCanvas.getContext('2d')
    if (srcCtx) {
      renderFoldedCanvas(srcCtx, canvas, foldMap, {
        foldProgress,
        showCreaseShadow,
        trimToFoldHeight,
      })
      const outCtx = canvas.getContext('2d')
      if (outCtx) {
        drawFaceFoldWatermark(outCtx, 16, 16)
      }
      const dataUrl = canvas.toDataURL('image/png')
      downloadFile(dataUrl, `facefold-${Date.now()}.png`)
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
      soundManager.playPaperCrease()
      soundManager.vibrate(30)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    }
  }

  // 5. Copy to Clipboard
  const handleCopyToClipboard = async () => {
    try {
      const srcCanvas = await getSourceCanvas()
      const canvas = document.createElement('canvas')
      const srcCtx = srcCanvas.getContext('2d')
      if (srcCtx) {
        renderFoldedCanvas(srcCtx, canvas, foldMap, {
          foldProgress,
          showCreaseShadow,
          trimToFoldHeight,
        })
        const outCtx = canvas.getContext('2d')
        if (outCtx) {
          drawFaceFoldWatermark(outCtx, 16, 16)
        }
        canvas.toBlob(async (blob) => {
          if (!blob) return
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setCopied(true)
          soundManager.vibrate(30)
          setTimeout(() => setCopied(false), 2500)
        })
      }
    } catch {
      handleDownloadImage()
    }
  }

  // 6. Share FaceFold App with Friends
  const handleShareWithFriends = async () => {
    soundManager.playPaperCrease()
    const shareUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : ''
    const shareText = "Check out this hilarious new app that lets you fold your face! 😂👃"

    // Try Native Web Share API first (opens WhatsApp, Messages, etc. directly on iOS & Android)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'FaceFold',
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err: any) {
        if (err.name === 'AbortError') return
      }
    }

    // Direct WhatsApp share fallback
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      }
    } catch {}

    window.open(whatsappUrl, '_blank')
    setShareFeedback('Opened WhatsApp! Message & link copied to clipboard.')
    setTimeout(() => setShareFeedback(null), 4000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 mt-3 select-none">
      {/* 1. INTERACTIVE REVEAL CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3.5">
        {/* Fold Slider Header & Bounce Flap Button */}
        <div className="flex flex-col gap-2 px-1">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span>Fold:</span>
              <span className="font-mono text-cyan-300 text-[11px] bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 ml-1">
                {Math.round(foldProgress * 100)}%
              </span>
            </span>

            {/* Accordion Flap Loop Toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800/80 hover:bg-slate-755 text-slate-300 border-slate-700'
              }`}
              title="Loop flap bounce"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Bounce'}</span>
            </button>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={foldProgress}
            onChange={(e) => {
              if (isPlaying) setIsPlaying(false)
              onFoldProgressChange(parseFloat(e.target.value))
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none mt-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Secondary Toggle: Crease */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <button
            onClick={() => onToggleCreaseShadow(!showCreaseShadow)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              showCreaseShadow
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Crease</span>
          </button>
        </div>
      </div>

      {/* 2. EXPANDABLE DOWNLOAD SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all duration-300">
        {/* Header / Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDownloadExpanded((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/60 transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Download and Share</h3>
              <div className="text-[11px] text-slate-400">GIF • Photo • Split • Copy</div>
            </div>
          </div>

          <div
            className={`p-1.5 rounded-xl bg-slate-800 text-slate-300 transition-transform duration-300 ${
              isExpanded ? 'rotate-180 text-pink-400 bg-pink-500/20' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-slate-800/80">
            {/* Download Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* OPTION 1: Transition Animated GIF */}
              <button
                onClick={handleExportTransitionGIF}
                disabled={isExportingTransition}
                className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-850 hover:from-cyan-950/90 hover:to-slate-800 border border-cyan-500/40 flex items-center justify-between group transition active:scale-98 disabled:opacity-60 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    {isExportingTransition ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Film className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Loop GIF</span>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                        .GIF
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isExportingTransition
                        ? `Creating (${transitionProgress}%)...`
                        : 'Smooth animation'}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 shrink-0">
                  {isExportingTransition ? 'Working' : 'Get GIF'}
                </span>
              </button>

              {/* OPTION 2: Before & After Snap GIF */}
              <button
                onClick={handleExportSnapGIF}
                disabled={isExportingSnap}
                className="p-3 rounded-2xl bg-gradient-to-r from-pink-950/60 to-slate-850 hover:from-pink-950/90 hover:to-slate-800 border border-pink-500/40 flex items-center justify-between group transition active:scale-98 disabled:opacity-60 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    {isExportingSnap ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Snap GIF</span>
                      <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded font-mono">
                        Meme
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isExportingSnap
                        ? `Creating (${snapProgress}%)...`
                        : 'Flip animation'}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-pink-300 bg-pink-500/20 px-2.5 py-1 rounded-lg border border-pink-500/30 shrink-0">
                  {isExportingSnap ? 'Working' : 'Get GIF'}
                </span>
              </button>

              {/* OPTION 3: Save Single Folded Picture (PNG) */}
              <button
                onClick={handleDownloadImage}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 flex items-center justify-between group transition active:scale-98 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                    {downloadSuccess ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Save Photo</div>
                    <div className="text-[11px] text-slate-400">High quality PNG</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-300 bg-slate-700 px-2.5 py-1 rounded-lg shrink-0">
                  {downloadSuccess ? 'Saved!' : 'Save'}
                </span>
              </button>

              {/* OPTION 4: Side-by-Side Split Photo */}
              <button
                onClick={handleExportSideBySide}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 flex items-center justify-between group transition active:scale-98 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Columns className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Split Photo</div>
                    <div className="text-[11px] text-slate-400">Side-by-side PNG</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 shrink-0">
                  Save
                </span>
              </button>
            </div>

            {/* Copy to Clipboard Bar */}
            <button
              onClick={handleCopyToClipboard}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-300">
                  {copied ? 'Copied to Clipboard!' : 'Copy Photo'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-purple-300">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. STEP NAVIGATION FOOTER */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onAdjustLines}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Edit Lines</span>
        </button>

        <button
          onClick={onNewPhoto}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
          <span>New Photo</span>
        </button>
      </div>

      {/* 4. SHARE FACEFOLD WITH FRIENDS BUTTON */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <button
          type="button"
          onClick={handleShareWithFriends}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition transform active:scale-98 cursor-pointer select-none"
        >
          <Share2 className="w-4 h-4" />
          <span>Share FaceFold with your friends!</span>
        </button>

        {shareFeedback && (
          <p className="text-xs text-emerald-400 font-medium text-center">
            ✓ {shareFeedback}
          </p>
        )}
      </div>
    </div>
  )
}
