import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { Point, Stroke, FoldMode } from '../types/fold'
import { strokeToColumnY } from '../utils/curveUtils'
import { soundManager } from '../utils/soundEffects'
import { RotateCcw, Sparkles, Check, ArrowRight, Wand2, ZoomIn, Crop } from 'lucide-react'

interface DrawingCanvasProps {
  imageSrc: string
  topStroke: Stroke
  bottomStroke: Stroke
  foldMode: FoldMode
  onFoldModeChange: (mode: FoldMode) => void
  onTopStrokeChange: (stroke: Stroke) => void
  onBottomStrokeChange: (stroke: Stroke) => void
  onFoldReady: () => void
  onAutoPlaceLines: () => void
  onOpenCrop: () => void
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  imageSrc,
  topStroke,
  bottomStroke,
  foldMode,
  onFoldModeChange,
  onTopStrokeChange,
  onBottomStrokeChange,
  onFoldReady,
  onAutoPlaceLines,
  onOpenCrop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [activeLine, setActiveLine] = useState<'top' | 'bottom'>('top')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Stroke>([])
  const [showLoupe, setShowLoupe] = useState(true)
  const [loupePoint, setLoupePoint] = useState<{
    screenX: number
    screenY: number
    canvasPt: Point
  } | null>(null)

  // Load the base image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      setImage(img)
    }
  }, [imageSrc])

  // Automatically switch to bottom line if top line has just been drawn and bottom is empty
  useEffect(() => {
    if (topStroke.length > 0 && bottomStroke.length === 0) {
      setActiveLine('bottom')
    }
  }, [topStroke, bottomStroke])

  // Redraw canvas whenever strokes or active line changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Draw background image
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    // Render shaded collapse zone if both lines exist
    const hasTop = topStroke.length > 1 || (activeLine === 'top' && currentStroke.length > 1)
    const effectiveTop = activeLine === 'top' && currentStroke.length > 1 ? currentStroke : topStroke

    const hasBottom = bottomStroke.length > 1 || (activeLine === 'bottom' && currentStroke.length > 1)
    const effectiveBottom = activeLine === 'bottom' && currentStroke.length > 1 ? currentStroke : bottomStroke

    if (hasTop && hasBottom) {
      const colTop = strokeToColumnY(effectiveTop, width, foldMode)
      const colBottom = strokeToColumnY(effectiveBottom, width, foldMode)

      ctx.save()
      // Draw highlighted fill between top and bottom lines
      ctx.beginPath()
      // Top line left-to-right
      for (let x = 0; x < width; x++) {
        const yt = Math.min(colTop.yValues[x], colBottom.yValues[x])
        if (x === 0) ctx.moveTo(x, yt)
        else ctx.lineTo(x, yt)
      }
      // Bottom line right-to-left
      for (let x = width - 1; x >= 0; x--) {
        const yb = Math.max(colTop.yValues[x], colBottom.yValues[x])
        ctx.lineTo(x, yb)
      }
      ctx.closePath()

      // Striped / translucent fill
      ctx.fillStyle = 'rgba(236, 72, 153, 0.28)'
      ctx.fill()

      // Subtle fold border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.restore()
    }

    // Helper to draw a single squiggly line
    const renderStroke = (
      stroke: Stroke,
      color: string,
      glowColor: string,
      label: string,
      isActive: boolean
    ) => {
      if (stroke.length < 2) return

      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Outer glow
      ctx.shadowColor = glowColor
      ctx.shadowBlur = isActive ? 14 : 6
      ctx.strokeStyle = color
      ctx.lineWidth = isActive ? 5 : 3.5

      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.stroke()

      // Inner white core for neon effect
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = isActive ? 2 : 1.5
      ctx.stroke()

      // Draw start and end pin badges
      const pStart = stroke[0]
      const pEnd = stroke[stroke.length - 1]

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pStart.x, pStart.y, 6, 0, Math.PI * 2)
      ctx.arc(pEnd.x, pEnd.y, 6, 0, Math.PI * 2)
      ctx.fill()

      // Label badge
      const midPoint = stroke[Math.floor(stroke.length / 2)]
      ctx.font = 'bold 12px monospace'
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(label, midPoint.x, midPoint.y - 12)

      ctx.restore()
    }

    // Render Top Line (Cyan)
    if (topStroke.length > 1 && !(activeLine === 'top' && isDrawing)) {
      renderStroke(topStroke, '#06b6d4', 'rgba(6, 182, 212, 0.8)', 'LINE 1 (TOP)', activeLine === 'top')
    }

    // Render Bottom Line (Pink)
    if (bottomStroke.length > 1 && !(activeLine === 'bottom' && isDrawing)) {
      renderStroke(bottomStroke, '#ec4899', 'rgba(236, 72, 153, 0.8)', 'LINE 2 (BOTTOM)', activeLine === 'bottom')
    }

    // Render currently drawing stroke
    if (isDrawing && currentStroke.length > 1) {
      if (activeLine === 'top') {
        renderStroke(currentStroke, '#06b6d4', 'rgba(6, 182, 212, 0.9)', 'LINE 1', true)
      } else {
        renderStroke(currentStroke, '#ec4899', 'rgba(236, 72, 153, 0.9)', 'LINE 2', true)
      }
    }
  }, [image, topStroke, bottomStroke, activeLine, isDrawing, currentStroke, foldMode])

  useEffect(() => {
    redraw()
  }, [redraw])

  // Helper to draw the magnifying glass loupe preview
  const drawLoupe = useCallback(
    (pt: Point) => {
      const canvas = canvasRef.current
      const loupeCanvas = loupeCanvasRef.current
      if (!canvas || !loupeCanvas) return

      const ctx = loupeCanvas.getContext('2d')
      if (!ctx) return

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const logicalSize = 120
      const zoom = 2.2

      if (
        loupeCanvas.width !== logicalSize * dpr ||
        loupeCanvas.height !== logicalSize * dpr
      ) {
        loupeCanvas.width = logicalSize * dpr
        loupeCanvas.height = logicalSize * dpr
      }

      const w = loupeCanvas.width
      const h = loupeCanvas.height

      ctx.save()
      ctx.clearRect(0, 0, w, h)

      // Circular clip
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2)
      ctx.clip()

      // Background fill
      ctx.fillStyle = '#0b0e14'
      ctx.fillRect(0, 0, w, h)

      // Slice calculation from main canvas
      const rect = canvas.getBoundingClientRect()
      const canvasScaleX = canvas.width / rect.width
      const canvasScaleY = canvas.height / rect.height

      const sw = (logicalSize / zoom) * canvasScaleX
      const sh = (logicalSize / zoom) * canvasScaleY
      const sx = pt.x - sw / 2
      const sy = pt.y - sh / 2

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, w, h)

      // Reticle crosshair
      const cx = w / 2
      const cy = h / 2

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.lineWidth = 1.6 * dpr
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 3 * dpr

      const gap = 8 * dpr
      const len = 14 * dpr

      ctx.beginPath()
      // Horizontal crosshairs
      ctx.moveTo(cx - len - gap, cy)
      ctx.lineTo(cx - gap, cy)
      ctx.moveTo(cx + gap, cy)
      ctx.lineTo(cx + len + gap, cy)
      // Vertical crosshairs
      ctx.moveTo(cx, cy - len - gap)
      ctx.lineTo(cx, cy - gap)
      ctx.moveTo(cx, cy + gap)
      ctx.lineTo(cx, cy + len + gap)
      ctx.stroke()

      // Aiming circle around reticle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1 * dpr
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.arc(cx, cy, gap, 0, Math.PI * 2)
      ctx.stroke()

      // Glowing center dot in active neon color
      const activeColor = activeLine === 'top' ? '#06b6d4' : '#ec4899'
      ctx.shadowBlur = 8 * dpr
      ctx.shadowColor = activeColor
      ctx.fillStyle = activeColor
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5 * dpr, 0, Math.PI * 2)
      ctx.fill()

      // Inner white pinpoint
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx, cy, 1.2 * dpr, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    },
    [activeLine]
  )

  const updateLoupePoint = (
    e: React.PointerEvent<HTMLCanvasElement>,
    pt: Point
  ) => {
    const container = containerRef.current
    if (container) {
      const cRect = container.getBoundingClientRect()
      setLoupePoint({
        screenX: e.clientX - cRect.left,
        screenY: e.clientY - cRect.top,
        canvasPt: pt,
      })
    }
  }

  const getLoupePosition = () => {
    if (!loupePoint || !containerRef.current) {
      return { x: 0, y: 0, isFlippedBelow: false }
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const LOUPE_SIZE = 120
    const OFFSET_Y = 85

    let posX = loupePoint.screenX - LOUPE_SIZE / 2
    posX = Math.max(10, Math.min(containerRect.width - LOUPE_SIZE - 10, posX))

    const isFlippedBelow = loupePoint.screenY < OFFSET_Y + LOUPE_SIZE / 2 + 15
    const posY = isFlippedBelow
      ? loupePoint.screenY + 45
      : loupePoint.screenY - OFFSET_Y - LOUPE_SIZE / 2

    return { x: posX, y: posY, isFlippedBelow }
  }

  // Pointer position helpers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    const pt = getCanvasPoint(e)
    setCurrentStroke([pt])
    if (showLoupe) updateLoupePoint(e, pt)
    soundManager.playPaperCrease()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const pt = getCanvasPoint(e)
    if (showLoupe) updateLoupePoint(e, pt)
    setCurrentStroke((prev) => {
      // Avoid micro duplicates
      const last = prev[prev.length - 1]
      if (last && Math.hypot(last.x - pt.x, last.y - pt.y) < 3) {
        return prev
      }
      return [...prev, pt]
    })
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setLoupePoint(null)

    if (currentStroke.length > 2) {
      soundManager.vibrate(20)
      if (activeLine === 'top') {
        onTopStrokeChange(currentStroke)
        setActiveLine('bottom')
      } else {
        onBottomStrokeChange(currentStroke)
      }
    }
    setCurrentStroke([])
  }

  useEffect(() => {
    if (isDrawing && loupePoint && showLoupe) {
      drawLoupe(loupePoint.canvasPt)
    }
  }, [isDrawing, loupePoint, showLoupe, drawLoupe, currentStroke])

  const handleClearCurrent = () => {
    if (activeLine === 'top') {
      onTopStrokeChange([])
    } else {
      onBottomStrokeChange([])
    }
  }

  const handleClearAll = () => {
    onTopStrokeChange([])
    onBottomStrokeChange([])
    setActiveLine('top')
  }

  const bothLinesDrawn = topStroke.length > 1 && bottomStroke.length > 1

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Step Instruction Banner */}
      <div className="w-full mb-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md ${
              activeLine === 'top'
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                : 'bg-pink-500 text-white shadow-pink-500/30 ring-2 ring-pink-400/50'
            }`}
          >
            {activeLine === 'top' ? '1' : '2'}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {activeLine === 'top' ? 'Step 1: Top Fold Line' : 'Step 2: Bottom Fold Line'}
            </div>
            <div className="text-sm font-medium text-slate-200">
              {activeLine === 'top'
                ? 'Draw a squiggly line across the top of the nose bridge'
                : 'Draw a squiggly line across the bottom of the nose'}
            </div>
          </div>
        </div>

        {/* Line Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveLine('top')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeLine === 'top'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Line 1 {topStroke.length > 1 ? '✓' : ''}
          </button>
          <button
            onClick={() => setActiveLine('bottom')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeLine === 'bottom'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Line 2 {bottomStroke.length > 1 ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] sm:aspect-square max-h-[580px] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center touch-none-all select-none"
      >
        {image ? (
          <canvas
            ref={canvasRef}
            width={image.naturalWidth || 600}
            height={image.naturalHeight || 600}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full object-contain cursor-crosshair touch-none-all"
            style={{ touchAction: 'none' }}
          />
        ) : (
          <div className="text-slate-500 text-sm animate-pulse">Loading photo...</div>
        )}

        {/* Floating helper badge on canvas if not yet drawn */}
        {topStroke.length === 0 && !isDrawing && (
          <div className="absolute top-4 pointer-events-none bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/30 text-xs text-cyan-300 font-medium shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Use your finger or mouse to draw across the nose!
          </div>
        )}

        {/* Precision Magnifying Glass Loupe (Follows finger, floats above) */}
        {showLoupe && isDrawing && loupePoint && (() => {
          const pos = getLoupePosition()
          return (
            <div
              className="absolute pointer-events-none z-30 select-none will-change-transform"
              style={{
                left: 0,
                top: 0,
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              }}
            >
              <div
                className={`relative rounded-full p-1 shadow-2xl backdrop-blur-md transition-colors ${
                  activeLine === 'top'
                    ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-cyan-500/50 ring-4 ring-cyan-500/20'
                    : 'bg-pink-500/20 border-2 border-pink-400 shadow-pink-500/50 ring-4 ring-pink-500/20'
                }`}
              >
                <canvas
                  ref={loupeCanvasRef}
                  className="w-[120px] h-[120px] rounded-full block bg-slate-950"
                />

                {/* Pointer Arrow Stem pointing at the contact point */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 ${
                    pos.isFlippedBelow
                      ? '-top-2 border-t-2 border-l-2 border-r-0 border-b-0'
                      : '-bottom-2'
                  } ${
                    activeLine === 'top'
                      ? 'bg-slate-950 border-cyan-400'
                      : 'bg-slate-950 border-pink-400'
                  }`}
                />
              </div>

              {/* Floating Loupe Badge */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap ${
                  pos.isFlippedBelow ? '-bottom-5' : '-top-5'
                } ${
                  activeLine === 'top'
                    ? 'bg-cyan-950/95 text-cyan-300 border border-cyan-500/40'
                    : 'bg-pink-950/95 text-pink-300 border border-pink-500/40'
                }`}
              >
                Aiming Loupe • 2.2x
              </div>
            </div>
          )
        })()}
      </div>

      {/* Toolbar beneath canvas */}
      <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2.5 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCrop}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-pink-300 text-xs font-medium border border-pink-500/30 transition shadow"
            title="Crop & frame photo"
          >
            <Crop className="w-3.5 h-3.5 text-pink-400" />
            Crop
          </button>
          <button
            onClick={onAutoPlaceLines}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow"
            title="Automatically place sample fold lines across the nose"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            Auto Lines
          </button>
          <button
            onClick={handleClearCurrent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition"
            title="Redraw current active line"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Redraw {activeLine === 'top' ? 'Line 1' : 'Line 2'}
          </button>
          <button
            onClick={handleClearAll}
            className="px-2.5 py-2 text-slate-400 hover:text-rose-400 text-xs font-medium transition"
          >
            Reset
          </button>

          {/* Fold Span Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => onFoldModeChange('full-paper')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                foldMode === 'full-paper'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Fold across the whole paper (like TikTok paper fold)"
            >
              Paper Fold
            </button>
            <button
              onClick={() => onFoldModeChange('local-pinch')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                foldMode === 'local-pinch'
                  ? 'bg-slate-800 text-pink-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Fold only the nose area"
            >
              Local Pinch
            </button>
          </div>

          {/* Loupe Magnifier Toggle */}
          <button
            onClick={() => setShowLoupe(!showLoupe)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showLoupe
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-500'
            }`}
            title="Toggle magnifying loupe above finger while drawing"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Loupe {showLoupe ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Next / Fold Button */}
        <button
          onClick={onFoldReady}
          disabled={!bothLinesDrawn}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl transition transform active:scale-95 ${
            bothLinesDrawn
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-pink-500/25 hover:opacity-95 hover:shadow-cyan-500/25'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          {bothLinesDrawn ? (
            <>
              <Check className="w-4 h-4" />
              Collapse &amp; Fold Face!
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>Draw Both Lines to Fold</>
          )}
        </button>
      </div>
    </div>
  )
}
