import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { ColumnFoldMap } from '../types/fold'
import { renderFoldedCanvas } from './imageCollapse'

export interface GifExportOptions {
  showCreaseShadow: boolean
  trimToFoldHeight: boolean
  targetWidth?: number
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

  // Keyframe progress schedule: Fold down -> Pause -> Fold up -> Pause
  const progresses = [
    { t: 0.0, delay: 350 },
    { t: 0.15, delay: 60 },
    { t: 0.35, delay: 60 },
    { t: 0.6, delay: 60 },
    { t: 0.85, delay: 60 },
    { t: 1.0, delay: 400 },
    { t: 0.85, delay: 60 },
    { t: 0.6, delay: 60 },
    { t: 0.35, delay: 60 },
    { t: 0.15, delay: 60 },
    { t: 0.0, delay: 350 },
  ]

  for (let i = 0; i < progresses.length; i++) {
    const { t, delay } = progresses[i]

    renderFoldedCanvas(scaledSrcCtx, frameCanvas, scaledFoldMap, {
      foldProgress: t,
      showCreaseShadow: options.showCreaseShadow,
      trimToFoldHeight: options.trimToFoldHeight,
    })

    const frameCtx = frameCanvas.getContext('2d')
    if (!frameCtx) continue

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
    await new Promise((r) => setTimeout(r, 8))
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

  // Frame 1: BEFORE (Original)
  renderFoldedCanvas(scaledCtx, frameCanvas, scaledFoldMap, {
    foldProgress: 0.0,
    showCreaseShadow: false,
    trimToFoldHeight: options.trimToFoldHeight,
  })
  // Draw BEFORE badge
  const ctx1 = frameCanvas.getContext('2d')!
  drawBadge(ctx1, 'BEFORE (ORIGINAL)', '#06b6d4')
  let imgData = ctx1.getImageData(0, 0, frameCanvas.width, frameCanvas.height)
  let palette = quantize(imgData.data, 256)
  let index = applyPalette(imgData.data, palette)
  gif.writeFrame(index, frameCanvas.width, frameCanvas.height, {
    palette,
    delay: 850, // 850ms hold
  })
  if (onProgress) onProgress(50)

  // Frame 2: AFTER (Folded)
  renderFoldedCanvas(scaledCtx, frameCanvas, scaledFoldMap, {
    foldProgress: 1.0,
    showCreaseShadow: options.showCreaseShadow,
    trimToFoldHeight: options.trimToFoldHeight,
  })
  // Draw AFTER badge
  const ctx2 = frameCanvas.getContext('2d')!
  drawBadge(ctx2, 'AFTER (FOLDED) 😆', '#ec4899')
  imgData = ctx2.getImageData(0, 0, frameCanvas.width, frameCanvas.height)
  palette = quantize(imgData.data, 256)
  index = applyPalette(imgData.data, palette)
  gif.writeFrame(index, frameCanvas.width, frameCanvas.height, {
    palette,
    delay: 850, // 850ms hold
  })
  if (onProgress) onProgress(100)

  gif.finish()
  return new Blob([gif.bytes() as unknown as BlobPart], { type: 'image/gif' })
}

/**
 * Creates a single side-by-side composite photo (Left: Before, Right: After)
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
  drawBadge(ctx, 'BEFORE', '#06b6d4', 20, 24)

  // Draw Center Divider Line
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(w, 0)
  ctx.lineTo(w, compCanvas.height)
  ctx.stroke()

  // Draw Right: Folded
  const rightY = (compCanvas.height - foldedCanvas.height) / 2
  ctx.drawImage(foldedCanvas, w, rightY)
  drawBadge(ctx, 'AFTER 😆', '#ec4899', w + 20, 24)

  return compCanvas
}

// Helper to draw clean badges on frames
function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string,
  x: number = 14,
  y: number = 20
) {
  ctx.save()
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif'
  const metrics = ctx.measureText(text)
  const padX = 10
  const padY = 5
  const boxW = metrics.width + padX * 2
  const boxH = 22

  ctx.fillStyle = 'rgba(11, 14, 20, 0.85)'
  ctx.beginPath()
  ctx.roundRect ? ctx.roundRect(x, y - padY, boxW, boxH, 6) : ctx.rect(x, y - padY, boxW, boxH)
  ctx.fill()

  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + boxH / 2 - padY)
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
