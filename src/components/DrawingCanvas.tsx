import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { Point, Stroke, FoldMode } from '../types/fold'
import { computeFoldMap } from '../utils/curveUtils'
import { soundManager } from '../utils/soundEffects'
import { RotateCcw, ArrowRight, ZoomIn, ZoomOut, ArrowLeft } from 'lucide-react'

interface DrawingCanvasProps {
  imageSrc: string
  topStroke: Stroke
  bottomStroke: Stroke
  foldMode: FoldMode
  onFoldModeChange: (mode: FoldMode) => void
  onTopStrokeChange: (stroke: Stroke) => void
  onBottomStrokeChange: (stroke: Stroke) => void
  onFoldReady: () => void
  onBack: () => void
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
  onBack,
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
    clientX: number
    clientY: number
    canvasPt: Point
  } | null>(null)

  // Pinch-to-zoom & Pan state
  const [scale, setScale] = useState(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const isPinchingRef = useRef(false)
  const pinchStartRef = useRef<{
    dist: number
    scale: number
    midX: number
    midY: number
    panX: number
    panY: number
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
      const foldData = computeFoldMap(effectiveTop, effectiveBottom, width, foldMode)
      const isCrease = foldMode === 'crease' || foldMode === 'full-paper'

      let startX = 0
      let endX = width - 1

      if (!isCrease) {
        while (startX < width && foldData.gap[startX] === 0) startX++
        while (endX >= 0 && foldData.gap[endX] === 0) endX--
      }

      if (startX <= endX) {
        ctx.save()
        // Draw highlighted fill between top and bottom lines
        ctx.beginPath()
        // Top line left-to-right
        for (let x = startX; x <= endX; x++) {
          const yt = foldData.yTop[x]
          if (x === startX) ctx.moveTo(x, yt)
          else ctx.lineTo(x, yt)
        }
        // Bottom line right-to-left
        for (let x = endX; x >= startX; x--) {
          const yb = foldData.yBottom[x]
          ctx.lineTo(x, yb)
        }
        ctx.closePath()

        // Translucent fill
        ctx.fillStyle = 'rgba(236, 72, 153, 0.28)'
        ctx.fill()

        // Subtle fold border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.restore()
      }
    }

    // Helper to draw a single squiggly line
    const renderStroke = (
      stroke: Stroke,
      color: string,
      glowColor: string,
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
      ctx.restore()
    }
    // Render Top Line (Cyan)
    if (topStroke.length > 1 && !(activeLine === 'top' && isDrawing)) {
      renderStroke(topStroke, '#06b6d4', 'rgba(6, 182, 212, 0.8)', activeLine === 'top')
    }

    // Render Bottom Line (Pink)
    if (bottomStroke.length > 1 && !(activeLine === 'bottom' && isDrawing)) {
      renderStroke(bottomStroke, '#ec4899', 'rgba(236, 72, 153, 0.8)', activeLine === 'bottom')
    }

    // Render currently drawing stroke
    if (isDrawing && currentStroke.length > 1) {
      if (activeLine === 'top') {
        renderStroke(currentStroke, '#06b6d4', 'rgba(6, 182, 212, 0.9)', true)
      } else {
        renderStroke(currentStroke, '#ec4899', 'rgba(236, 72, 153, 0.9)', true)
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
    setLoupePoint({
      clientX: e.clientX,
      clientY: e.clientY,
      canvasPt: pt,
    })
  }

  const getLoupePosition = () => {
    if (!loupePoint) {
      return { x: 0, y: 0 }
    }

    const LOUPE_SIZE = 120
    const GAP_ABOVE_FINGER = 26 // Gap between fingertip and bottom of loupe pointer stem

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
    let posX = loupePoint.clientX - LOUPE_SIZE / 2
    posX = Math.max(10, Math.min(screenWidth - LOUPE_SIZE - 10, posX))

    // ALWAYS position strictly above the finger!
    // Target Y sits GAP_ABOVE_FINGER above the touch point clientY
    const targetY = loupePoint.clientY - GAP_ABOVE_FINGER - LOUPE_SIZE
    const posY = Math.max(10, targetY)

    return { x: posX, y: posY }
  }

  // Pointer position helpers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY)),
    }
  }

  // 2-Finger Pinch to Zoom & Pan Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length >= 2) {
      isPinchingRef.current = true
      setIsDrawing(false)
      setCurrentStroke([])
      setLoupePoint(null)

      const t0 = e.touches[0]
      const t1 = e.touches[1]
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
      const midX = (t0.clientX + t1.clientX) / 2
      const midY = (t0.clientY + t1.clientY) / 2

      pinchStartRef.current = {
        dist,
        scale,
        midX,
        midY,
        panX: pan.x,
        panY: pan.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length >= 2 && pinchStartRef.current && containerRef.current) {
      const t0 = e.touches[0]
      const t1 = e.touches[1]
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
      const midX = (t0.clientX + t1.clientX) / 2
      const midY = (t0.clientY + t1.clientY) / 2

      const ratio = dist / pinchStartRef.current.dist
      const nextScale = Math.min(3.5, Math.max(1.0, pinchStartRef.current.scale * ratio))

      // Pan bounds
      const cRect = containerRef.current.getBoundingClientRect()
      const maxPanX = (cRect.width * (nextScale - 1)) / 2
      const maxPanY = (cRect.height * (nextScale - 1)) / 2

      const deltaX = midX - pinchStartRef.current.midX
      const deltaY = midY - pinchStartRef.current.midY

      const rawPanX = pinchStartRef.current.panX + deltaX
      const rawPanY = pinchStartRef.current.panY + deltaY

      const nextPanX = Math.min(maxPanX, Math.max(-maxPanX, rawPanX))
      const nextPanY = Math.min(maxPanY, Math.max(-maxPanY, rawPanY))

      setScale(nextScale)
      setPan({ x: nextPanX, y: nextPanY })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartRef.current = null
      setTimeout(() => {
        isPinchingRef.current = false
      }, 200)

      setScale((currentScale) => {
        if (currentScale <= 1.05) {
          setPan({ x: 0, y: 0 })
          return 1.0
        }
        return currentScale
      })
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault()
      const delta = -e.deltaY * 0.005
      setScale((prev) => {
        const next = Math.min(3.5, Math.max(1.0, prev + delta))
        if (next <= 1.02) {
          setPan({ x: 0, y: 0 })
          return 1.0
        }
        return next
      })
    }
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.5, Math.round((prev + 0.35) * 10) / 10))
  }

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1.0, Math.round((prev - 0.35) * 10) / 10)
      if (next <= 1.05) {
        setPan({ x: 0, y: 0 })
        return 1.0
      }
      return next
    })
  }

  const handleResetZoom = () => {
    setScale(1.0)
    setPan({ x: 0, y: 0 })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPinchingRef.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    const pt = getCanvasPoint(e)
    setCurrentStroke([pt])
    if (showLoupe) updateLoupePoint(e, pt)
    soundManager.playPaperCrease()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPinchingRef.current || !isDrawing) return
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
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Main Canvas Viewport - Responsively sized to image aspect ratio with dynamic height ceiling */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        className="relative w-full max-w-full bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center touch-none-all select-none mx-auto"
        style={{
          aspectRatio: image && image.naturalWidth && image.naturalHeight ? `${image.naturalWidth} / ${image.naturalHeight}` : '4 / 5',
          maxHeight: 'min(53dvh, 530px)',
          touchAction: 'none',
          overscrollBehavior: 'none',
        }}
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
            className="w-full h-full object-contain cursor-crosshair touch-none-all will-change-transform"
            style={{
              touchAction: 'none',
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isPinchingRef.current ? 'none' : 'transform 0.15s ease-out',
            }}
          />
        ) : (
          <div className="text-slate-500 text-sm animate-pulse">Loading photo...</div>
        )}

        {/* Floating Line Selector Switcher inside Canvas */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 z-20 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveLine('top')
            }}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeLine === 'top'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>👁️ Eye</span>
            {topStroke.length > 1 && <span className="text-[10px]">✓</span>}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveLine('bottom')
            }}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeLine === 'bottom'
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>👄 Mouth</span>
            {bottomStroke.length > 1 && <span className="text-[10px]">✓</span>}
          </button>
        </div>

        {/* Floating Controls Top-Right: Zoom Indicator + Pinch / Crease Switcher */}
        <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 z-20 flex items-center gap-1.5">
          {scale > 1.05 && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl py-1 px-2.5 shadow-xl backdrop-blur-md animate-fadeIn">
              <span className="text-cyan-400 text-xs font-mono font-bold">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleResetZoom}
                className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded-full transition cursor-pointer"
              >
                Fit
              </button>
            </div>
          )}

          {/* Mode Switcher: Pinch vs Crease */}
          <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onFoldModeChange('pinch')
                soundManager.vibrate(20)
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                foldMode !== 'crease' && foldMode !== 'full-paper'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Pinch: crease only where lines are drawn"
            >
              <span>Pinch</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onFoldModeChange('crease')
                soundManager.vibrate(20)
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                foldMode === 'crease' || foldMode === 'full-paper'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Crease: full paper fold edge-to-edge"
            >
              <span>Crease</span>
            </button>
          </div>
        </div>

        {/* Floating Contextual Tip on Photo (Hides during drawing so photo is never blocked) */}
        {!isDrawing && scale <= 1.05 && (
          <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-900/90 border border-slate-700/80 rounded-full px-3.5 py-1 text-slate-200 text-xs shadow-lg backdrop-blur-md flex items-center gap-2 whitespace-nowrap animate-fadeIn max-w-[92%] justify-center text-center">
            {bothLinesDrawn ? (
              <span className="text-emerald-300 font-semibold truncate">✨ Lines ready! Tap "Next Step" below</span>
            ) : activeLine === 'top' ? (
              <span className="text-cyan-300 font-semibold truncate">👁️ Draw line below eyes</span>
            ) : (
              <span className="text-pink-300 font-semibold truncate">👄 Draw line above mouth</span>
            )}
          </div>
        )}

        {/* Precision Magnifying Glass Loupe (ALWAYS strictly above finger, never blocked by hand) */}
        {showLoupe && isDrawing && loupePoint && (() => {
          const pos = getLoupePosition()
          return (
            <div
              className="fixed pointer-events-none z-50 select-none will-change-transform"
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

                {/* Pointer Arrow Stem pointing directly down at the finger contact point */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 ${
                    activeLine === 'top'
                      ? 'bg-slate-950 border-cyan-400'
                      : 'bg-slate-950 border-pink-400'
                  }`}
                />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Secondary Tools below canvas (Back, Redraw, Clear, Zoom Controls) */}
      <div className="w-full mt-2 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Back to Step 1 */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer"
            title="Back to photo"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Redraw line */}
          <button
            type="button"
            onClick={handleClearCurrent}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/70 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700/80 transition cursor-pointer"
            title="Redraw current line"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redraw</span>
          </button>

          {/* Reset all lines */}
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1.5 text-slate-400 hover:text-rose-400 text-xs font-medium transition cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Zoom & Loupe Controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Out / Reset / In stepper */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1.0}
              className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-35 transition cursor-pointer text-xs font-bold"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-1 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition cursor-pointer"
              title="Reset zoom (100% fit)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-35 transition cursor-pointer text-xs font-bold"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Loupe Magnifier Toggle */}
          <button
            type="button"
            onClick={() => setShowLoupe(!showLoupe)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              showLoupe
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-500'
            }`}
            title="Toggle magnifying loupe"
          >
            <span>Loupe</span>
          </button>
        </div>
      </div>

      {/* Primary Action: Next Step Fold Button */}
      <button
        type="button"
        disabled={!bothLinesDrawn}
        onClick={onFoldReady}
        className={`w-full mt-2 py-2.5 sm:py-3 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition select-none ${
          bothLinesDrawn
            ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-xl shadow-pink-500/25 transform active:scale-98 cursor-pointer ring-2 ring-pink-400/40'
            : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50 shadow-none'
        }`}
      >
        <span>
          {bothLinesDrawn
            ? 'Next Step: Fold Face!'
            : topStroke.length <= 1 && bottomStroke.length <= 1
            ? 'Draw Eye & Mouth Lines First'
            : topStroke.length <= 1
            ? 'Draw Eye Line to Continue'
            : 'Draw Mouth Line to Continue'}
        </span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  )
}
