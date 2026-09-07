import React, { useState } from 'react'
import {
  X,
  Image as ImageIcon,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Film,
  Repeat,
  Columns,
  Video,
} from 'lucide-react'
import {
  downloadFile,
  createTransitionGIF,
  createBeforeAfterSnapGIF,
  createSideBySideSnapshot,
} from '../utils/gifExport'
import type { ColumnFoldMap } from '../types/fold'
import { renderFoldedCanvas } from '../utils/imageCollapse'
import confetti from 'canvas-confetti'
import { soundManager } from '../utils/soundEffects'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  foldMap: ColumnFoldMap
  showCreaseShadow: boolean
  trimToFoldHeight: boolean
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  foldMap,
  showCreaseShadow,
  trimToFoldHeight,
}) => {
  const [isExportingTransition, setIsExportingTransition] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)

  const [isExportingSnap, setIsExportingSnap] = useState(false)
  const [snapProgress, setSnapProgress] = useState(0)

  const [isExportingVideo, setIsExportingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Load and cache source image as offscreen canvas
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

  // 1. Export Transition GIF (Smooth Folding Loop)
  const handleExportTransitionGIF = async () => {
    setIsExportingTransition(true)
    setTransitionProgress(10)
    try {
      const srcCanvas = await getSourceCanvas()
      const blob = await createTransitionGIF(
        srcCanvas,
        foldMap,
        { showCreaseShadow, trimToFoldHeight, targetWidth: 360 },
        (pct) => setTransitionProgress(pct)
      )
      downloadFile(blob, `nose-fold-transition-${Date.now()}.gif`)
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
      soundManager.playFoldSound(true)
    } finally {
      setIsExportingTransition(false)
    }
  }

  // 2. Export Before & After Snap GIF (2-Frame Fast Flip)
  const handleExportSnapGIF = async () => {
    setIsExportingSnap(true)
    setSnapProgress(20)
    try {
      const srcCanvas = await getSourceCanvas()
      const blob = await createBeforeAfterSnapGIF(
        srcCanvas,
        foldMap,
        { showCreaseShadow, trimToFoldHeight, targetWidth: 380 },
        (pct) => setSnapProgress(pct)
      )
      downloadFile(blob, `nose-fold-before-after-snap-${Date.now()}.gif`)
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
      soundManager.playPaperCrease()
    } finally {
      setIsExportingSnap(false)
    }
  }

  // 3. Export Before & After Split Snapshot (Side-by-Side PNG)
  const handleExportSideBySide = async () => {
    const srcCanvas = await getSourceCanvas()
    const compCanvas = createSideBySideSnapshot(srcCanvas, foldMap, {
      showCreaseShadow,
      trimToFoldHeight,
    })
    const dataUrl = compCanvas.toDataURL('image/png')
    downloadFile(dataUrl, `nose-fold-comparison-${Date.now()}.png`)
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
    soundManager.playPaperCrease()
  }

  // 4. Download Single Folded PNG
  const handleDownloadImage = async () => {
    const srcCanvas = await getSourceCanvas()
    const canvas = document.createElement('canvas')
    const srcCtx = srcCanvas.getContext('2d')
    if (srcCtx) {
      renderFoldedCanvas(srcCtx, canvas, foldMap, {
        foldProgress: 1.0,
        showCreaseShadow,
        trimToFoldHeight,
      })
      const dataUrl = canvas.toDataURL('image/png')
      downloadFile(dataUrl, `nose-folded-${Date.now()}.png`)
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } })
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
          foldProgress: 1.0,
          showCreaseShadow,
          trimToFoldHeight,
        })
        canvas.toBlob(async (blob) => {
          if (!blob) return
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ])
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        })
      }
    } catch {
      handleDownloadImage()
    }
  }

  // 6. Export Looping Video (WebM)
  const handleExportVideo = async () => {
    setIsExportingVideo(true)
    setVideoProgress(10)

    try {
      const srcCanvas = await getSourceCanvas()
      const width = srcCanvas.width
      const height = srcCanvas.height
      const srcCtx = srcCanvas.getContext('2d')
      if (!srcCtx) return

      const animCanvas = document.createElement('canvas')
      animCanvas.width = width
      animCanvas.height = height

      const stream = animCanvas.captureStream(30)
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        downloadFile(blob, `nose-fold-video-${Date.now()}.webm`)
        setIsExportingVideo(false)
      }

      recorder.start()

      const fps = 30
      const durationSec = 2.4
      const totalFrames = Math.round(fps * durationSec)
      let currentFrame = 0

      const step = () => {
        if (currentFrame >= totalFrames) {
          recorder.stop()
          return
        }

        const t = currentFrame / totalFrames
        const progress = 0.5 * (1 - Math.cos(t * Math.PI * 4))

        renderFoldedCanvas(srcCtx, animCanvas, foldMap, {
          foldProgress: progress,
          showCreaseShadow,
          trimToFoldHeight,
        })

        currentFrame++
        setVideoProgress(Math.round((currentFrame / totalFrames) * 100))
        setTimeout(step, 1000 / fps)
      }

      step()
    } catch {
      setIsExportingVideo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-white text-lg">Download &amp; Export Options</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-2.5">
          {/* OPTION 1: Transition GIF */}
          <button
            onClick={handleExportTransitionGIF}
            disabled={isExportingTransition}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 hover:from-cyan-950/90 hover:to-slate-850 border border-cyan-500/40 flex items-center justify-between group transition active:scale-98 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                {isExportingTransition ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Film className="w-5 h-5" />
                )}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>Transition Animated GIF</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                    .GIF
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {isExportingTransition
                    ? `Generating smooth GIF frames (${transitionProgress}%)...`
                    : 'Smooth looping fold & unfold animation'}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/30">
              {isExportingTransition ? 'Working' : 'Get GIF'}
            </span>
          </button>

          {/* OPTION 2: Before & After Snap GIF */}
          <button
            onClick={handleExportSnapGIF}
            disabled={isExportingSnap}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/60 to-slate-900 hover:from-pink-950/90 hover:to-slate-850 border border-pink-500/40 flex items-center justify-between group transition active:scale-98 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                {isExportingSnap ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>Before &amp; After Snap GIF</span>
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-mono">
                    Meme GIF
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {isExportingSnap
                    ? `Encoding snap GIF (${snapProgress}%)...`
                    : '2-frame rapid flip between Original & Folded face'}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-pink-300 bg-pink-500/20 px-3 py-1.5 rounded-xl border border-pink-500/30">
              {isExportingSnap ? 'Working' : 'Get GIF'}
            </span>
          </button>

          {/* OPTION 3: Side-by-Side Snapshot Photo */}
          <button
            onClick={handleExportSideBySide}
            className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between group transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                <Columns className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Before &amp; After Split Photo</div>
                <div className="text-xs text-slate-400">Side-by-side comparison image (PNG)</div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              Save PNG
            </span>
          </button>

          {/* OPTION 4: Single Folded Picture (PNG) */}
          <button
            onClick={handleDownloadImage}
            className="w-full p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between group transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Single Folded Photo</div>
                <div className="text-xs text-slate-400">High-resolution folded picture</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-slate-750 px-3 py-1 rounded-lg">
              Download
            </span>
          </button>

          {/* OPTION 5: Copy to Clipboard */}
          <button
            onClick={handleCopyToClipboard}
            className="w-full p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between group transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="font-semibold text-white text-xs">
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                </div>
                <div className="text-[11px] text-slate-400">Paste directly into WhatsApp / Discord</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-300">
              {copied ? 'Done' : 'Copy'}
            </span>
          </button>

          {/* OPTION 6: Video (WebM) */}
          <button
            onClick={handleExportVideo}
            disabled={isExportingVideo}
            className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 flex items-center justify-between group transition active:scale-98 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700/60 text-slate-400 flex items-center justify-center shrink-0">
                {isExportingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-300 text-xs">
                  {isExportingVideo ? `Recording Video (${videoProgress}%)...` : 'Export Video Clip (WebM)'}
                </div>
                <div className="text-[11px] text-slate-500">Video format for mobile players</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {isExportingVideo ? 'Working' : 'Video'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
