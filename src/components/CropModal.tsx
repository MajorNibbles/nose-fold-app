import React, { useRef, useState, useEffect, useCallback } from 'react'
import { X, Check, RotateCw, Crop as CropIcon, Square, Maximize2 } from 'lucide-react'

interface CropModalProps {
  isOpen: boolean
  imageSrc: string
  onClose: () => void
  onApplyCrop: (croppedDataUrl: string) => void
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

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [rotation, setRotation] = useState<number>(0) // 0, 90, 180, 270
  const [aspect, setAspect] = useState<AspectRatio>('free')

  // Crop box in container coordinate space (pixels)
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  })

  // Track drag state
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
    if (!isOpen) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      setImage(img)
      setRotation(0)
    }
  }, [isOpen, imageSrc])

  // Compute displayed image bounding box inside container
  const getImageBounds = useCallback(() => {
    if (!image || !containerRef.current) {
      return { x: 0, y: 0, w: 0, h: 0, scale: 1, rotW: 0, rotH: 0 }
    }
    const container = containerRef.current
    const cWidth = container.clientWidth || 360
    const cHeight = container.clientHeight || 450

    const rotW = rotation % 180 === 0 ? image.naturalWidth : image.naturalHeight
    const rotH = rotation % 180 === 0 ? image.naturalHeight : image.naturalWidth

    const pad = 20
    const availW = Math.max(50, cWidth - pad * 2)
    const availH = Math.max(50, cHeight - pad * 2)

    const scale = Math.min(availW / rotW, availH / rotH)
    const dispW = rotW * scale
    const dispH = rotH * scale
    const dispX = (cWidth - dispW) / 2
    const dispY = (cHeight - dispH) / 2

    return { x: dispX, y: dispY, w: dispW, h: dispH, scale, rotW, rotH }
  }, [image, rotation])

  // Initialize crop box to centered box whenever image, rotation, or aspect changes
  useEffect(() => {
    if (!isOpen || !image) return
    const bounds = getImageBounds()
    if (bounds.w === 0 || bounds.h === 0) return

    let targetW = bounds.w * 0.85
    let targetH = bounds.h * 0.85

    if (aspect === '1:1') {
      const size = Math.min(targetW, targetH)
      targetW = size
      targetH = size
    } else if (aspect === '4:5') {
      const ratio = 4 / 5
      if (targetW / targetH > ratio) {
        targetW = targetH * ratio
      } else {
        targetH = targetW / ratio
      }
    } else if (aspect === '3:4') {
      const ratio = 3 / 4
      if (targetW / targetH > ratio) {
        targetW = targetH * ratio
      } else {
        targetH = targetW / ratio
      }
    }

    const startX = bounds.x + (bounds.w - targetW) / 2
    const startY = bounds.y + (bounds.h - targetH) / 2

    setCrop({
      x: Math.round(startX),
      y: Math.round(startY),
      w: Math.round(targetW),
      h: Math.round(targetH),
    })
  }, [isOpen, image, rotation, aspect, getImageBounds])

  // Rotate image by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  // Pointer drag handling
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
      // Constrain within image bounds
      x = Math.max(bounds.x, Math.min(bounds.x + bounds.w - w, x))
      y = Math.max(bounds.y, Math.min(bounds.y + bounds.h - h, y))
      setCrop({ x, y, w, h })
      return
    }

    // Resizing
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

    // Maintain aspect ratio if locked
    if (aspect === '1:1') {
      const size = Math.min(nextW, nextH)
      if (dragMode.includes('w')) nextX += nextW - size
      if (dragMode.includes('n')) nextY += nextH - size
      nextW = size
      nextH = size
    } else if (aspect === '4:5') {
      const ratio = 4 / 5
      nextH = nextW / ratio
    } else if (aspect === '3:4') {
      const ratio = 3 / 4
      nextH = nextW / ratio
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

  // Apply crop and export cropped image
  const handleApply = () => {
    if (!image) return
    const bounds = getImageBounds()
    if (bounds.scale <= 0) return

    // Crop box in rotated image coordinates
    const srcX = (crop.x - bounds.x) / bounds.scale
    const srcY = (crop.y - bounds.y) / bounds.scale
    const srcW = crop.w / bounds.scale
    const srcH = crop.h / bounds.scale

    // 1. Draw rotated image onto intermediate canvas
    const rotCanvas = document.createElement('canvas')
    rotCanvas.width = bounds.rotW
    rotCanvas.height = bounds.rotH
    const rotCtx = rotCanvas.getContext('2d')
    if (!rotCtx) return

    rotCtx.translate(bounds.rotW / 2, bounds.rotH / 2)
    rotCtx.rotate((rotation * Math.PI) / 180)
    rotCtx.drawImage(
      image,
      -image.naturalWidth / 2,
      -image.naturalHeight / 2
    )

    // 2. Extract cropped rectangle
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = Math.max(50, Math.round(srcW))
    finalCanvas.height = Math.max(50, Math.round(srcH))
    const finalCtx = finalCanvas.getContext('2d')
    if (!finalCtx) return

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

    const croppedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.92)
    onApplyCrop(croppedDataUrl)
    onClose()
  }

  if (!isOpen) return null

  const bounds = getImageBounds()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Crop &amp; Frame Face</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio & Rotate Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          {/* Aspect ratios */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAspect('free')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                aspect === 'free'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setAspect('1:1')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                aspect === '1:1'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Square className="w-3 h-3" />
              1:1 Square
            </button>
            <button
              onClick={() => setAspect('4:5')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                aspect === '4:5'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4:5 Portrait
            </button>
          </div>

          {/* Rotate Button */}
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Rotate 90 degrees clockwise"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Rotate</span>
          </button>
        </div>

        {/* Main Crop Viewport */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex-1 min-h-[340px] sm:min-h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden touch-none"
          style={{ touchAction: 'none' }}
        >
          {/* Rotated Image Display */}
          {image && (
            <img
              src={image.src}
              alt="Crop target"
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

          {/* Dark Overlay around crop box */}
          {crop.w > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(
                    circle at ${crop.x + crop.w / 2}px ${crop.y + crop.h / 2}px,
                    transparent 0px,
                    rgba(0,0,0,0.65) ${Math.max(crop.w, crop.h)}px
                  )
                `,
              }}
            />
          )}

          {/* Semi-transparent dark mask blocks */}
          {crop.w > 0 && (
            <>
              {/* Top */}
              <div
                className="absolute left-0 top-0 w-full bg-black/60 pointer-events-none"
                style={{ height: crop.y }}
              />
              {/* Bottom */}
              <div
                className="absolute left-0 w-full bg-black/60 pointer-events-none"
                style={{ top: crop.y + crop.h, bottom: 0 }}
              />
              {/* Left */}
              <div
                className="absolute left-0 bg-black/60 pointer-events-none"
                style={{ top: crop.y, height: crop.h, width: crop.x }}
              />
              {/* Right */}
              <div
                className="absolute right-0 bg-black/60 pointer-events-none"
                style={{ top: crop.y, height: crop.h, left: crop.x + crop.w }}
              />
            </>
          )}

          {/* Crop Box Rectangle with Drag Handles */}
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
              {/* Rule of Thirds Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
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

              {/* Corner Handles */}
              {/* North-West */}
              <div
                onPointerDown={(e) => handlePointerDown('nw', e)}
                className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-nw-resize touch-none shadow"
              />
              {/* North-East */}
              <div
                onPointerDown={(e) => handlePointerDown('ne', e)}
                className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-ne-resize touch-none shadow"
              />
              {/* South-West */}
              <div
                onPointerDown={(e) => handlePointerDown('sw', e)}
                className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-sw-resize touch-none shadow"
              />
              {/* South-East */}
              <div
                onPointerDown={(e) => handlePointerDown('se', e)}
                className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-cyan-400 rounded-full cursor-se-resize touch-none shadow"
              />

              {/* Edge Handles */}
              {/* North */}
              <div
                onPointerDown={(e) => handlePointerDown('n', e)}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-cyan-400 rounded-full cursor-n-resize touch-none shadow"
              />
              {/* South */}
              <div
                onPointerDown={(e) => handlePointerDown('s', e)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-cyan-400 rounded-full cursor-s-resize touch-none shadow"
              />
              {/* West */}
              <div
                onPointerDown={(e) => handlePointerDown('w', e)}
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-8 bg-cyan-400 rounded-full cursor-w-resize touch-none shadow"
              />
              {/* East */}
              <div
                onPointerDown={(e) => handlePointerDown('e', e)}
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-8 bg-cyan-400 rounded-full cursor-e-resize touch-none shadow"
              />

              {/* Center crosshair helper */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            Apply Crop &amp; Frame
          </button>
        </div>
      </div>
    </div>
  )
}
