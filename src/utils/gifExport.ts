import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { ColumnFoldMap } from '../types/fold'
import { renderFoldedCanvas } from './imageCollapse'

export interface GifExportOptions {
  showCreaseShadow: boolean
  trimToFoldHeight: boolean
  targetWidth?: number
  beforeDelay?: number
  afterDelay?: number
  anchorTop?: boolean
}


/**
 * Creates a smooth looping animated GIF of the accordion fold transition.
 */
export async function createTransitionGIF(
  sourceCanvas: HTMLCanvasElement,
  foldMap: ColumnFoldMap,
  options: GifExportOptions,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const gif = GIFEncoder()
  const targetW = options.targetWidth || 360
  const aspect = sourceCanvas.height / sourceCanvas.width
  const targetH = Math.round(targetW * aspect)

  // Offscreen render canvas at target size
  const scaledSourceCanvas = document.createElement('canvas')
  scaledSourceCanvas.width = targetW
  scaledSourceCanvas.height = targetH
  const scaledSrcCtx = scaledSourceCanvas.getContext('2d')
  if (!scaledSrcCtx) throw new Error('Could not get canvas context')
  scaledSrcCtx.drawImage(sourceCanvas, 0, 0, targetW, targetH)

  // Scale the foldMap to target width
  const scaledFoldMap: ColumnFoldMap = {
    yTop: new Float32Array(targetW),
    yBottom: new Float32Array(targetW),
    gap: new Float32Array(targetW),
    maxGap: foldMap.maxGap * (targetW / sourceCanvas.width),
  }
  const ratioX = sourceCanvas.width / targetW
  for (let x = 0; x < targetW; x++) {
    const origX = Math.min(sourceCanvas.width - 1, Math.round(x * ratioX))
    scaledFoldMap.yTop[x] = foldMap.yTop[origX] * (targetH / sourceCanvas.height)
    scaledFoldMap.yBottom[x] = foldMap.yBottom[origX] * (targetH / sourceCanvas.height)
    scaledFoldMap.gap[x] = foldMap.gap[origX] * (targetH / sourceCanvas.height)
  }

  const frameCanvas = document.createElement('canvas')

  // Smooth ease-in-out curve for natural, organic folding motion
  const easeInOutCubic = (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  }

  const intermediateSteps = 16 // 16 silky smooth frames per fold
  const frameDelay = 40        // 40ms per frame (~25 fps visual rate)
  const unfoldedHold = 2000    // Hold unfolded for 2.0 seconds
  const foldedHold = 2400      // Hold folded for 2.4 seconds

  const progresses: { t: number; delay: number }[] = []

  // 1. Hold Unfolded (Original face)
  progresses.push({ t: 0.0, delay: unfoldedHold })

  // 2. Smoothly Fold Up (0 -> 1)
  for (let i = 1; i <= intermediateSteps; i++) {
    const fraction = i / (intermediateSteps + 1)
    const t = easeInOutCubic(fraction)
    progresses.push({ t: Math.round(t * 1000) / 1000, delay: frameDelay })
  }

  // 3. Hold Folded (Funny squished face)
  progresses.push({ t: 1.0, delay: foldedHold })

  // 4. Smoothly Unfold Down (1 -> 0)
  for (let i = intermediateSteps; i >= 1; i--) {
    const fraction = i / (intermediateSteps + 1)
    const t = easeInOutCubic(fraction)
    progresses.push({ t: Math.round(t * 1000) / 1000, delay: frameDelay })
  }

  for (let i = 0; i < progresses.length; i++) {
    const { t, delay } = progresses[i]

    renderFoldedCanvas(scaledSrcCtx, frameCanvas, scaledFoldMap, {
      foldProgress: t,
      showCreaseShadow: options.showCreaseShadow,
      trimToFoldHeight: false, // Keep constant full frame for GIF
      anchorTop: true,         // Anchor top so chin folds UP, leaving space below
      canvasBgColor: '#000000', // Crisp solid black space below the fold
    })

    const frameCtx = frameCanvas.getContext('2d')
    if (!frameCtx) continue

    // Watermark in top left
    drawFaceFoldWatermark(frameCtx, 12, 12)

    const { data, width, height } = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)

    gif.writeFrame(index, width, height, {
      palette,
      delay,
    })

    if (onProgress) {
      onProgress(Math.round(((i + 1) / progresses.length) * 100))
    }

    // Allow UI thread to breathe
    await new Promise((r) => setTimeout(r, 6))
  }

  gif.finish()
  return new Blob([gif.bytes() as unknown as BlobPart], { type: 'image/gif' })
}

/**
 * Creates a punchy 2-frame snap GIF that flips between BEFORE and AFTER.
 */
export async function createBeforeAfterSnapGIF(
  sourceCanvas: HTMLCanvasElement,
  foldMap: ColumnFoldMap,
  options: GifExportOptions,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const gif = GIFEncoder()
  const targetW = options.targetWidth || 400
  const aspect = sourceCanvas.height / sourceCanvas.width
  const targetH = Math.round(targetW * aspect)

  const scaledSource = document.createElement('canvas')
  scaledSource.width = targetW
  scaledSource.height = targetH
  const scaledCtx = scaledSource.getContext('2d')
  if (!scaledCtx) throw new Error('Could not get canvas context')
  scaledCtx.drawImage(sourceCanvas, 0, 0, targetW, targetH)

  // Scale the foldMap to target width
  const scaledFoldMap: ColumnFoldMap = {
    yTop: new Float32Array(targetW),
    yBottom: new Float32Array(targetW),
    gap: new Float32Array(targetW),
    maxGap: foldMap.maxGap * (targetW / sourceCanvas.width),
  }
  const ratioX = sourceCanvas.width / targetW
  for (let x = 0; x < targetW; x++) {
    const origX = Math.min(sourceCanvas.width - 1, Math.round(x * ratioX))
    scaledFoldMap.yTop[x] = foldMap.yTop[origX] * (targetH / sourceCanvas.height)
    scaledFoldMap.yBottom[x] = foldMap.yBottom[origX] * (targetH / sourceCanvas.height)
    scaledFoldMap.gap[x] = foldMap.gap[origX] * (targetH / sourceCanvas.height)
  }

  const frameCanvas = document.createElement('canvas')

  const beforeDelay = options.beforeDelay ?? 750
  const afterDelay = options.afterDelay ?? 2400

  // Frame 1: Original Face
  renderFoldedCanvas(scaledCtx, frameCanvas, scaledFoldMap, {
    foldProgress: 0.0,
    showCreaseShadow: false,
    trimToFoldHeight: false,
    anchorTop: true,
    canvasBgColor: '#000000',
  })
  const ctx1 = frameCanvas.getContext('2d')!
  drawFaceFoldWatermark(ctx1, 14, 14)
  let imgData = ctx1.getImageData(0, 0, frameCanvas.width, frameCanvas.height)
  let palette = quantize(imgData.data, 256)
  let index = applyPalette(imgData.data, palette)
  gif.writeFrame(index, frameCanvas.width, frameCanvas.height, {
    palette,
    delay: beforeDelay, // 750ms quick look at original face
  })
  if (onProgress) onProgress(50)

  // Frame 2: Folded Face
  renderFoldedCanvas(scaledCtx, frameCanvas, scaledFoldMap, {
    foldProgress: 1.0,
    showCreaseShadow: options.showCreaseShadow,
    trimToFoldHeight: false,
    anchorTop: true,
    canvasBgColor: '#000000',
  })
  const ctx2 = frameCanvas.getContext('2d')!
  drawFaceFoldWatermark(ctx2, 14, 14)
  imgData = ctx2.getImageData(0, 0, frameCanvas.width, frameCanvas.height)
  palette = quantize(imgData.data, 256)
  index = applyPalette(imgData.data, palette)
  gif.writeFrame(index, frameCanvas.width, frameCanvas.height, {
    palette,
    delay: afterDelay, // 2400ms (2.4s) extended hold on the funny folded face
  })
  if (onProgress) onProgress(100)

  gif.finish()
  return new Blob([gif.bytes() as unknown as BlobPart], { type: 'image/gif' })
}

/**
 * Creates a single side-by-side composite photo (Left: Original, Right: Folded)
 */
export function createSideBySideSnapshot(
  sourceCanvas: HTMLCanvasElement,
  foldMap: ColumnFoldMap,
  options: GifExportOptions
): HTMLCanvasElement {
  const w = sourceCanvas.width
  const h = sourceCanvas.height

  // Render Folded canvas
  const foldedCanvas = document.createElement('canvas')
  const srcCtx = sourceCanvas.getContext('2d')!
  renderFoldedCanvas(srcCtx, foldedCanvas, foldMap, {
    foldProgress: 1.0,
    showCreaseShadow: options.showCreaseShadow,
    trimToFoldHeight: options.trimToFoldHeight,
    anchorTop: true,
    canvasBgColor: '#000000',
  })

  // Composite canvas: 2 side-by-side panels
  const compCanvas = document.createElement('canvas')
  compCanvas.width = w * 2
  compCanvas.height = Math.max(h, foldedCanvas.height)
  const ctx = compCanvas.getContext('2d')!

  // Fill background
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(0, 0, compCanvas.width, compCanvas.height)

  // Draw Left: Original
  const leftY = (compCanvas.height - h) / 2
  ctx.drawImage(sourceCanvas, 0, leftY)

  // Draw Center Divider Line
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w, 0)
  ctx.lineTo(w, compCanvas.height)
  ctx.stroke()

  // Draw Right: Folded
  const rightY = (compCanvas.height - foldedCanvas.height) / 2
  ctx.drawImage(foldedCanvas, w, rightY)

  // Watermark in top left
  drawFaceFoldWatermark(ctx, 16, 16)

  return compCanvas
}

/**
 * Draws the clean, minimal "FaceFold" watermark pill in the top-left of any canvas.
 * Responsively scales to fit small GIFs and high-resolution photos alike.
 */
export function drawFaceFoldWatermark(
  ctx: CanvasRenderingContext2D,
  x: number = 14,
  y: number = 14
) {
  ctx.save()
  const canvasW = ctx.canvas?.width || 400
  const scale = Math.max(1, Math.min(3.5, canvasW / 400))
  const fontSize = Math.round(12 * scale)
  const padX = Math.round(8 * scale)
  const boxH = Math.round(22 * scale)
  const radius = Math.round(6 * scale)
  const actualX = Math.round(x * (scale > 1.5 ? scale * 0.75 : 1))
  const actualY = Math.round(y * (scale > 1.5 ? scale * 0.75 : 1))

  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  const text = 'FaceFold'
  const metrics = ctx.measureText(text)
  const boxW = metrics.width + padX * 2

  // Translucent dark glass pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(actualX, actualY, boxW, boxH, radius)
  } else {
    ctx.rect(actualX, actualY, boxW, boxH)
  }
  ctx.fill()

  // Subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = Math.max(1, Math.round(1 * scale))
  ctx.stroke()

  // Text
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, actualX + padX, actualY + boxH / 2)
  ctx.restore()
}

/**
 * Canvas video recording helper (WebM)
 */
export async function recordFoldLoopWebM(
  renderFrame: (progress: number) => void,
  fps: number = 30,
  durationSec: number = 2.4
): Promise<Blob | null> {
  const offscreenCanvas = document.createElement('canvas')
  const stream = offscreenCanvas.captureStream ? offscreenCanvas.captureStream(fps) : null
  if (!stream || typeof MediaRecorder === 'undefined') return null

  return new Promise((resolve) => {
    try {
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
        resolve(blob)
      }

      recorder.start()

      const totalFrames = Math.round(fps * durationSec)
      let currentFrame = 0

      const interval = setInterval(() => {
        if (currentFrame >= totalFrames) {
          clearInterval(interval)
          recorder.stop()
          return
        }

        const t = currentFrame / totalFrames
        const progress = 0.5 * (1 - Math.cos(t * Math.PI * 4))
        renderFrame(progress)
        currentFrame++
      }, 1000 / fps)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Download a data URL or Blob as a file
 */
export function downloadFile(dataUrlOrBlob: string | Blob, filename: string) {
  const url =
    typeof dataUrlOrBlob === 'string'
      ? dataUrlOrBlob
      : URL.createObjectURL(dataUrlOrBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (typeof dataUrlOrBlob !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
}
