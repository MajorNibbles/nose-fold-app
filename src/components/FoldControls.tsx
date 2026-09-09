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
  Rocket,
} from 'lucide-react'
import { soundManager } from '../utils/soundEffects'
import { shareFaceFoldApp } from '../utils/shareUtils'
import confetti from 'canvas-confetti'
import type { ColumnFoldMap, FoldMode } from '../types/fold'
import {
  downloadFile,
  createTransitionGIF,
  createBeforeAfterSnapGIF,
  createSideBySideSnapshot,
  drawFaceFoldWatermark,
} from '../utils/gifExport'
import { renderFoldedCanvas } from '../utils/imageCollapse'
import { copyCanvasAsNormalImage } from '../utils/imageUtils'
import { trackEvent } from '../utils/analytics'

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
  foldMode?: FoldMode
  onFoldModeChange?: (mode: FoldMode) => void
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
  foldMode,
  onFoldModeChange,
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
  const [isBoosted, setIsBoosted] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [canSharePhoto, setCanSharePhoto] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        const testFile = new File(['test'], 'test.png', { type: 'image/png' })
        setCanSharePhoto(navigator.canShare({ files: [testFile] }))
      } catch {
        setCanSharePhoto(false)
      }
    }
  }, [])

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
      const maxFold = isBoosted ? 1.6 : 1.0
      const progress = (maxFold * 0.5) * (1 - Math.cos(phase * Math.PI * 2))
      onFoldProgressChange(progress)

      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, isBoosted, onFoldProgressChange])

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
      trackEvent('download_transition_gif', { format: 'gif' })
      trackEvent('file_download', { file_name: 'loop_gif', file_extension: 'gif' })
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
      trackEvent('download_snap_gif', { format: 'gif' })
      trackEvent('file_download', { file_name: 'snap_gif', file_extension: 'gif' })
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
    trackEvent('download_split_photo', { format: 'png' })
    trackEvent('file_download', { file_name: 'split_photo', file_extension: 'png' })
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
      trackEvent('download_photo', { format: 'png', fold_mode: foldMap.mode || 'crease' })
      trackEvent('file_download', { file_name: 'folded_photo', file_extension: 'png', fold_mode: foldMap.mode || 'crease' })
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    }
  }

  // 5. Copy to Clipboard (Copies as normal photo image for WhatsApp/Messages)
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
        const copiedOk = await copyCanvasAsNormalImage(canvas)
        if (copiedOk) {
          setCopied(true)
          soundManager.playPaperCrease()
          soundManager.vibrate(30)
          trackEvent('copy_photo_clipboard', { fold_mode: foldMap.mode || 'crease' })
          setTimeout(() => setCopied(false), 2500)
        } else {
          handleDownloadImage()
        }
      }
    } catch {
      handleDownloadImage()
    }
  }

  // 6. Share Folded Photo directly via Web Share API
  const handleSharePhoto = async () => {
    try {
      const srcCanvas = await getSourceCanvas()
      const canvas = document.createElement('canvas')
      const srcCtx = srcCanvas.getContext('2d')
      if (!srcCtx) return

      renderFoldedCanvas(srcCtx, canvas, foldMap, {
        foldProgress,
        showCreaseShadow,
        trimToFoldHeight,
      })
      const outCtx = canvas.getContext('2d')
      if (outCtx) {
        drawFaceFoldWatermark(outCtx, 16, 16)
      }

      const opaqueCanvas = document.createElement('canvas')
      opaqueCanvas.width = canvas.width
      opaqueCanvas.height = canvas.height
      const opaqueCtx = opaqueCanvas.getContext('2d')
      if (opaqueCtx) {
        opaqueCtx.fillStyle = '#ffffff'
        opaqueCtx.fillRect(0, 0, opaqueCanvas.width, opaqueCanvas.height)
        opaqueCtx.drawImage(canvas, 0, 0)
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        opaqueCanvas.toBlob(resolve, 'image/jpeg', 0.95)
      )
      if (!blob) return

      const file = new File([blob], `facefold-${Date.now()}.jpg`, { type: 'image/jpeg' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'FaceFold Photo',
          text: 'Check out my FaceFold photo! Fold your own face here: https://majornibbles.github.io/nose-fold-app/',
        })
        trackEvent('share_photo', { method: 'native_share' })
      } else {
        await handleCopyToClipboard()
      }
    } catch (err) {
      console.warn('Share photo dismissed or failed:', err)
    }
  }

  // 6. Share FaceFold App with Friends
  const handleShareWithFriends = async () => {
    soundManager.playPaperCrease()
    const res = await shareFaceFoldApp()
    trackEvent('share_app_friends', { method: res.method || 'native' })
    if (res.success && res.method !== 'native') {
      setShareFeedback('Opened WhatsApp! Message & link copied to clipboard.')
      setTimeout(() => setShareFeedback(null), 4000)
    }
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
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded-md border ml-1 transition-all ${
                  foldProgress > 1.0
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950 text-cyan-300 border-slate-800'
                }`}
              >
                {Math.round(foldProgress * 100)}%{foldProgress > 1.0 ? ' 🚀' : ''}
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
            max={isBoosted ? '2' : '1'}
            step="0.01"
            value={foldProgress}
            onChange={(e) => {
              if (isPlaying) setIsPlaying(false)
              const val = parseFloat(e.target.value)
              if (val > 1.0 && !isBoosted) {
                setIsBoosted(true)
              }
              onFoldProgressChange(val)
            }}
            className={`w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none mt-1 transition-all ${
              foldProgress > 1.0 ? 'accent-amber-400' : 'accent-pink-500'
            }`}
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0%</span>
            <span>{isBoosted ? '100%' : '50%'}</span>
            <span className={isBoosted ? 'text-amber-400 font-bold' : ''}>
              {isBoosted ? '200% 🚀' : '100%'}
            </span>
          </div>
        </div>

        {/* Secondary Toggles: Mode (Pinch vs Crease), Shadow & Boost */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          {/* Mode Switcher: Pinch vs Crease */}
          {foldMode && onFoldModeChange ? (
            <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  onFoldModeChange('pinch')
                  soundManager.vibrate(20)
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  foldMode !== 'crease' && foldMode !== 'full-paper'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pinch: fold only where lines are drawn"
              >
                Pinch
              </button>
              <button
                type="button"
                onClick={() => {
                  onFoldModeChange('crease')
                  soundManager.vibrate(20)
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  foldMode === 'crease' || foldMode === 'full-paper'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Crease: full paper fold edge-to-edge"
              >
                Crease
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCreaseShadow(!showCreaseShadow)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                showCreaseShadow
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Shadow</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playFoldSound(true)
                setIsBoosted((prev) => {
                  const next = !prev
                  if (next) {
                    onFoldProgressChange(Math.max(1.35, foldProgress))
                  } else if (foldProgress > 1.0) {
                    onFoldProgressChange(1.0)
                  }
                  return next
                })
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition active:scale-95 cursor-pointer ${
                isBoosted
                  ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/25 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Boost fold past 100%"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-400" />
              <span>Boost</span>
              {isBoosted && (
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/20 px-1 rounded">
                  200%
                </span>
              )}
            </button>
          </div>
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

            {/* Copy to Clipboard & Quick Share Photo (With matching logo cards) */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full">
              {/* Copy Photo Card */}
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="flex-1 p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-850 hover:from-purple-950/90 hover:to-slate-800 border border-purple-500/40 flex items-center justify-between group transition active:scale-98 text-left cursor-pointer"
                title="Copy photo to clipboard (pastes as a normal photo in WhatsApp, not a sticker)"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Copy Photo</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                        Normal Photo
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {copied ? '✓ Pastes as photo in WhatsApp' : 'Pastes as photo in WhatsApp'}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30 shrink-0">
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>

              {/* Share Photo Card (When supported) */}
              {canSharePhoto && (
                <button
                  type="button"
                  onClick={handleSharePhoto}
                  className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-850 hover:from-emerald-950/90 hover:to-slate-800 border border-emerald-500/40 flex items-center justify-between sm:justify-center gap-2.5 group transition active:scale-98 text-left cursor-pointer shrink-0"
                  title="Share photo directly to WhatsApp, Messages, or AirDrop"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <Share2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="sm:hidden">
                      <div className="font-bold text-white text-xs">Share Photo</div>
                      <div className="text-[11px] text-slate-400">WhatsApp / AirDrop</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                    Share
                  </span>
                </button>
              )}
            </div>
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
