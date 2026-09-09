import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Upload,
  Camera,
  RotateCw,
  Square,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { fileToOptimizedDataUrl } from '../utils/imageUtils'

interface Step1UploadCropProps {
  initialImageSrc: string
  onTriggerCamera: () => void
  onFileUpload: (dataUrl: string) => void
  onNext: (croppedDataUrl: string) => void
}

type AspectRatio = 'free' | '1:1' | '4:5' | '3:4'

type DragMode =
  | 'none'
  | 'move'
  | 'nw'
  | 'ne'
  | 'se'
  | 'sw'
  | 'n'
  | 's'
  | 'e'
  | 'w'

export const Step1UploadCrop: React.FC<Step1UploadCropProps> = ({
  initialImageSrc,
  onTriggerCamera,
  onFileUpload,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [rotation, setRotation] = useState<number>(0)
  const [aspect, setAspect] = useState<AspectRatio>('free')

  // Crop box in container coordinate space (pixels)
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  })

  // Drag state
  const [dragMode, setDragMode] = useState<DragMode>('none')
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [cropStart, setCropStart] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  })

  // Load image
  useEffect(() => {
    if (!initialImageSrc || initialImageSrc.trim().length === 0) {
      setImage(null)
      return
    }
    let isCancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = initialImageSrc
    img.onload = () => {
      if (!isCancelled) {
        setImage(img)
        setRotation(0)
      }
    }
    img.onerror = () => {
      if (!isCancelled) {
        setImage(null)
      }
    }
    return () => {
      isCancelled = true
    }
  }, [initialImageSrc])

  const hasUserImage = Boolean(image && initialImageSrc && initialImageSrc.trim().length > 0)

  // Compute displayed image bounding box inside container
  const getImageBounds = useCallback(() => {
    if (!image || !containerRef.current) {
      return { x: 0, y: 0, w: 0, h: 0, scale: 1, rotW: 0, rotH: 0 }
    }
    const container = containerRef.current
    const cWidth = container.clientWidth || 360
    const cHeight = container.clientHeight || 420

    const rotW = rotation % 180 === 0 ? image.naturalWidth : image.naturalHeight
    const rotH = rotation % 180 === 0 ? image.naturalHeight : image.naturalWidth

    const pad = 16
    const availW = Math.max(50, cWidth - pad * 2)
    const availH = Math.max(50, cHeight - pad * 2)

    const scale = Math.min(availW / rotW, availH / rotH)
    const dispW = rotW * scale
    const dispH = rotH * scale
    const dispX = (cWidth - dispW) / 2
    const dispY = (cHeight - dispH) / 2

    return { x: dispX, y: dispY, w: dispW, h: dispH, scale, rotW, rotH }
  }, [image, rotation])

  // Reset or center crop box whenever image, rotation, or aspect changes
  const resetCrop = useCallback(() => {
    if (!image) return
    const bounds = getImageBounds()
    if (bounds.w === 0 || bounds.h === 0) return

    let targetW = bounds.w * 0.9
    let targetH = bounds.h * 0.9

    if (aspect === '1:1') {
      const size = Math.min(targetW, targetH)
      targetW = size
      targetH = size
    } else if (aspect === '4:5') {
      const ratio = 4 / 5
      if (targetW / targetH > ratio) targetW = targetH * ratio
      else targetH = targetW / ratio
    } else if (aspect === '3:4') {
      const ratio = 3 / 4
      if (targetW / targetH > ratio) targetW = targetH * ratio
      else targetH = targetW / ratio
    }

    const startX = bounds.x + (bounds.w - targetW) / 2
    const startY = bounds.y + (bounds.h - targetH) / 2

    setCrop({
      x: Math.round(startX),
      y: Math.round(startY),
      w: Math.round(targetW),
      h: Math.round(targetH),
    })
  }, [image, aspect, getImageBounds])

  useEffect(() => {
    resetCrop()
  }, [image, rotation, aspect, resetCrop])

  // Drag handlers
  const handlePointerDown = (mode: DragMode, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragMode(mode)
    setDragStart({ x: e.clientX, y: e.clientY })
    setCropStart({ ...crop })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none') return
    e.preventDefault()
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    const bounds = getImageBounds()

    const minW = 60
    const minH = 60

    let { x, y, w, h } = cropStart

    if (dragMode === 'move') {
      x += dx
      y += dy
      x = Math.max(bounds.x, Math.min(bounds.x + bounds.w - w, x))
      y = Math.max(bounds.y, Math.min(bounds.y + bounds.h - h, y))
      setCrop({ x, y, w, h })
      return
    }

    let nextX = x
    let nextY = y
    let nextW = w
    let nextH = h

    if (dragMode.includes('e')) {
      nextW = Math.max(minW, Math.min(bounds.x + bounds.w - x, w + dx))
    }
    if (dragMode.includes('s')) {
      nextH = Math.max(minH, Math.min(bounds.y + bounds.h - y, h + dy))
    }
    if (dragMode.includes('w')) {
      const maxDx = w - minW
      const actualDx = Math.min(maxDx, Math.max(bounds.x - x, dx))
      nextX = x + actualDx
      nextW = w - actualDx
    }
    if (dragMode.includes('n')) {
      const maxDy = h - minH
      const actualDy = Math.min(maxDy, Math.max(bounds.y - y, dy))
      nextY = y + actualDy
      nextH = h - actualDy
    }

    if (aspect === '1:1') {
      const side = Math.min(nextW, nextH)
      nextW = side
      nextH = side
    } else if (aspect === '4:5') {
      const ratio = 4 / 5
      if (nextW / nextH > ratio) nextW = nextH * ratio
      else nextH = nextW / ratio
    } else if (aspect === '3:4') {
      const ratio = 3 / 4
      if (nextW / nextH > ratio) nextW = nextH * ratio
      else nextH = nextW / ratio
    }

    setCrop({
      x: Math.round(nextX),
      y: Math.round(nextY),
      w: Math.round(nextW),
      h: Math.round(nextH),
    })
  }

  const handlePointerUp = () => {
    setDragMode('none')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const optimized = await fileToOptimizedDataUrl(file, 1400)
      onFileUpload(optimized.dataUrl)
    } catch (err) {
      console.error('File load error:', err)
    }
  }

  // Export cropped slice from current canvas
  const handleNextStep = () => {
    if (!image) return
    const bounds = getImageBounds()
    if (bounds.w === 0 || bounds.h === 0 || bounds.scale === 0) {
      onNext(initialImageSrc)
      return
    }

    const srcX = (crop.x - bounds.x) / bounds.scale
    const srcY = (crop.y - bounds.y) / bounds.scale
    const srcW = crop.w / bounds.scale
    const srcH = crop.h / bounds.scale

    const rotCanvas = document.createElement('canvas')
    rotCanvas.width = bounds.rotW
    rotCanvas.height = bounds.rotH
    const rotCtx = rotCanvas.getContext('2d')
    if (!rotCtx) {
      onNext(initialImageSrc)
      return
    }

    rotCtx.translate(bounds.rotW / 2, bounds.rotH / 2)
    rotCtx.rotate((rotation * Math.PI) / 180)
    rotCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = Math.max(50, Math.round(srcW))
    finalCanvas.height = Math.max(50, Math.round(srcH))
    const finalCtx = finalCanvas.getContext('2d')
    if (!finalCtx) {
      onNext(initialImageSrc)
      return
    }

    finalCtx.drawImage(
      rotCanvas,
      srcX,
      srcY,
      srcW,
      srcH,
      0,
      0,
      finalCanvas.width,
      finalCanvas.height
    )

    const croppedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.94)
    onNext(croppedDataUrl)
  }

  const handleTakePhotoClick = () => {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const hasGetUserMedia = !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    )

    if (isMobile || !hasGetUserMedia || !isLocalhost) {
      cameraInputRef.current?.click()
    } else {
      onTriggerCamera()
    }
  }

  const bounds = getImageBounds()

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3.5 select-none">
      {/* Tiny Instruction Banner */}
      <div className="w-full py-1.5 px-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center text-xs text-cyan-200/90 font-medium flex items-center justify-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          {!hasUserImage
            ? 'Upload a picture of the face to fold'
            : 'Adjust crop or tap Add Line to fold'}
        </span>
      </div>

      {/* 1. TOP PHOTO CHOOSER BAR (Camera & Upload) */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleTakePhotoClick}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition transform active:scale-98 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Camera</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm border border-slate-700/80 shadow transition transform active:scale-98 cursor-pointer"
        >
          <Upload className="w-4 h-4 text-pink-400" />
          <span>Upload</span>
        </button>
      </div>

      {/* 2. CROP CANVAS CONTAINER OR HOLDING ILLUSTRATION */}
      <div className="relative w-full aspect-[4/5] sm:aspect-square max-h-[500px] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col">
        {hasUserImage ? (
          <>
            {/* Aspect & Rotate Controls Overlay */}
            <div className="z-20 px-3.5 py-2 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-2">
              {/* Aspect ratios */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAspect('free')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    aspect === 'free'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setAspect('1:1')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    aspect === '1:1'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Square className="w-3 h-3" />
                  <span>1:1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspect('4:5')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    aspect === '4:5'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4:5
                </button>
              </div>

              {/* Rotate & Reset */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3 h-3 text-amber-400" />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={resetCrop}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                  title="Reset Crop Box"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Viewport Area */}
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative flex-1 w-full bg-slate-950 flex items-center justify-center overflow-hidden touch-none"
              style={{ touchAction: 'none' }}
            >
              {/* Rotated image display */}
              {image && (
                <img
                  src={image.src}
                  alt="Face to fold"
                  style={{
                    position: 'absolute',
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.w,
                    height: bounds.h,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                  }}
                  className="object-contain"
                />
              )}

              {/* Dark masks */}
              {crop.w > 0 && (
                <>
                  <div
                    className="absolute left-0 top-0 w-full bg-black/60 pointer-events-none"
                    style={{ height: crop.y }}
                  />
                  <div
                    className="absolute left-0 w-full bg-black/60 pointer-events-none"
                    style={{ top: crop.y + crop.h, bottom: 0 }}
                  />
                  <div
                    className="absolute left-0 bg-black/60 pointer-events-none"
                    style={{ top: crop.y, height: crop.h, width: crop.x }}
                  />
                  <div
                    className="absolute right-0 bg-black/60 pointer-events-none"
                    style={{ top: crop.y, height: crop.h, left: crop.x + crop.w }}
                  />
                </>
              )}

              {/* Draggable Crop Box */}
              {crop.w > 0 && (
                <div
                  onPointerDown={(e) => handlePointerDown('move', e)}
                  style={{
                    position: 'absolute',
                    left: crop.x,
                    top: crop.y,
                    width: crop.w,
                    height: crop.h,
                    touchAction: 'none',
                  }}
                  className="border-2 border-cyan-400 shadow-2xl cursor-move touch-none"
                >
                  {/* Grid */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Corner handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown('nw', e)}
                    className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-nw-resize touch-none shadow"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown('ne', e)}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-ne-resize touch-none shadow"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown('sw', e)}
                    className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-sw-resize touch-none shadow"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown('se', e)}
                    className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-se-resize touch-none shadow"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Fun Little Holding Illustration when no photo is loaded */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-900/60 hover:from-slate-900/70 transition group"
          >
            {/* Animated Cartoon Face Graphic */}
            <div className="relative transition-transform duration-300 group-hover:scale-105 active:scale-95">
              <svg
                viewBox="0 0 200 200"
                className="w-44 h-44 sm:w-52 sm:h-52 drop-shadow-[0_12px_28px_rgba(236,72,153,0.3)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Warm Face Gradient */}
                  <linearGradient id="faceGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="45%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>

                  {/* Blush Cheek Radial Gradient */}
                  <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </radialGradient>

                  {/* Origami Party Cap Gradient */}
                  <linearGradient id="partyHatGrad" x1="80" y1="10" x2="140" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Floating Stars */}
                <g className="animate-pulse">
                  <path
                    d="M 165 24 L 168 34 L 178 37 L 168 40 L 165 50 L 162 40 L 152 37 L 162 34 Z"
                    fill="#38bdf8"
                  />
                  <path
                    d="M 28 82 L 30 89 L 37 91 L 30 93 L 28 100 L 26 93 L 19 91 L 26 89 Z"
                    fill="#f472b6"
                  />
                  <path
                    d="M 172 142 L 174 147 L 179 149 L 174 151 L 172 156 L 170 151 L 165 149 L 170 147 Z"
                    fill="#facc15"
                  />
                </g>

                {/* Origami Folded Hat */}
                <polygon
                  points="100,12 135,60 80,52"
                  fill="url(#partyHatGrad)"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="100" cy="12" r="6" fill="#38bdf8" />
                <circle cx="98" cy="10" r="2" fill="#ffffff" />

                {/* Cartoon Head Base */}
                <rect
                  x="32"
                  y="46"
                  width="136"
                  height="136"
                  rx="48"
                  fill="url(#faceGrad)"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                />

                {/* Big Adorable Eyes */}
                {/* Left Eye */}
                <g>
                  <ellipse cx="74" cy="98" rx="14" ry="18" fill="#1e1b4b" />
                  <circle cx="70" cy="92" r="5" fill="#ffffff" />
                  <circle cx="78" cy="104" r="2.5" fill="#ffffff" />
                  <path
                    d="M 64 74 Q 74 67 84 74"
                    stroke="#b45309"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>

                {/* Right Eye */}
                <g>
                  <ellipse cx="126" cy="98" rx="14" ry="18" fill="#1e1b4b" />
                  <circle cx="122" cy="92" r="5" fill="#ffffff" />
                  <circle cx="130" cy="104" r="2.5" fill="#ffffff" />
                  <path
                    d="M 116 74 Q 126 67 136 74"
                    stroke="#b45309"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>

                {/* Rosy Blush Cheeks */}
                <ellipse cx="56" cy="116" rx="14" ry="8" fill="url(#blushGrad)" />
                <ellipse cx="144" cy="116" rx="14" ry="8" fill="url(#blushGrad)" />

                {/* Cute Nose */}
                <path
                  d="M 98 107 C 98 111 102 111 102 107"
                  stroke="#d97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Happy Open Smile */}
                <path
                  d="M 82 124 Q 100 148 118 124"
                  fill="#dc2626"
                  stroke="#991b1b"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 92 133 Q 100 144 108 133 Z"
                  fill="#f472b6"
                />

                {/* Fold Line Across the Face */}
                <line
                  x1="22"
                  y1="110"
                  x2="178"
                  y2="110"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                />

                {/* Fold Tabs */}
                <g transform="translate(18, 102)">
                  <rect x="0" y="0" width="16" height="16" rx="4" fill="#ec4899" />
                  <path
                    d="M 5 8 L 11 8 M 9 6 L 11 8 L 9 10"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <g transform="translate(166, 102)">
                  <rect x="0" y="0" width="16" height="16" rx="4" fill="#ec4899" />
                  <path
                    d="M 11 8 L 5 8 M 7 6 L 5 8 L 7 10"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>

            {/* Instruction text */}
            <p className="mt-3 text-xs font-semibold text-slate-300 tracking-wide text-center">
              Upload a picture of the face to fold
            </p>

            {/* Holding Action Buttons */}
            <div className="mt-3 flex items-center gap-3 w-full max-w-xs justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTakePhotoClick()
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-pink-400" />
                <span>Upload</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. NEXT STEP BUTTON (Disabled until image loaded) */}
      <button
        type="button"
        disabled={!hasUserImage}
        onClick={handleNextStep}
        className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition select-none ${
          hasUserImage
            ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-xl shadow-pink-500/25 transform active:scale-98 cursor-pointer ring-2 ring-pink-400/40'
            : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50 shadow-none'
        }`}
      >
        <span>{hasUserImage ? 'Next Step: Draw Lines' : 'Upload a Photo to Continue'}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
