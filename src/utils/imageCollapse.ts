import type { ColumnFoldMap } from '../types/fold'

export interface RenderOptions {
  foldProgress: number // 0.0 to 1.0
  showCreaseShadow: boolean
  trimToFoldHeight: boolean
  canvasBgColor?: string
  anchorTop?: boolean // When true, anchors the top so the face folds UP, leaving black space below
}

/**
 * Fast subpixel/nearest sampling from source ImageData
 */
export function renderFoldedCanvas(
  sourceCtx: CanvasRenderingContext2D,
  targetCanvas: HTMLCanvasElement,
  foldMap: ColumnFoldMap,
  options: RenderOptions
) {
  const width = sourceCtx.canvas.width
  const height = sourceCtx.canvas.height
  const { foldProgress, showCreaseShadow, trimToFoldHeight, anchorTop = false } = options

  // Get raw pixels of source image
  const sourceImageData = sourceCtx.getImageData(0, 0, width, height)
  const srcData = sourceImageData.data

  // Calculate destination height
  let avgGap = 0
  for (let x = 0; x < width; x++) {
    avgGap += foldMap.gap[x]
  }
  avgGap /= width

  const collapsedAmount = avgGap * foldProgress
  const destHeight = trimToFoldHeight
    ? Math.max(50, Math.round(height - collapsedAmount))
    : height

  targetCanvas.width = width
  targetCanvas.height = destHeight

  const targetCtx = targetCanvas.getContext('2d')
  if (!targetCtx) return

  const destImageData = targetCtx.createImageData(width, destHeight)
  const dstData = destImageData.data

  // Clear / fill background with solid black if full frame
  if (!trimToFoldHeight) {
    const isTransparent = options.canvasBgColor === 'transparent'
    const bgA = isTransparent ? 0 : 255
    for (let i = 0; i < dstData.length; i += 4) {
      dstData[i] = 0       // R: 0 (Pure Black)
      dstData[i + 1] = 0   // G: 0
      dstData[i + 2] = 0   // B: 0
      dstData[i + 3] = bgA // Alpha: 255 (Opaque)
    }
  }

  // Vertical offset: 0 if anchored at top or trimmed, otherwise centered
  const yOffset = trimToFoldHeight || anchorTop ? 0 : Math.round(collapsedAmount * 0.5)

  for (let x = 0; x < width; x++) {
    const yTop = foldMap.yTop[x]
    const gap = foldMap.gap[x]
    const currentShift = gap * foldProgress

    for (let y = 0; y < destHeight; y++) {
      // Corresponding Y in source space
      let srcY: number

      if (trimToFoldHeight) {
        if (y < yTop) {
          srcY = y
        } else {
          srcY = y + currentShift
        }
      } else {
        const localY = y - yOffset
        if (localY < 0 || localY >= height - currentShift) {
          continue
        }
        if (localY < yTop) {
          srcY = localY
        } else {
          srcY = localY + currentShift
        }
      }

      if (srcY < 0 || srcY >= height) continue

      // Pixel indices
      const floorY = Math.floor(srcY)
      const ceilY = Math.min(height - 1, floorY + 1)
      const fracY = srcY - floorY

      const srcIdx1 = (floorY * width + x) * 4
      const srcIdx2 = (ceilY * width + x) * 4
      const dstIdx = (y * width + x) * 4

      // Bilinear vertical blend for silky smooth seam
      let r = srcData[srcIdx1] * (1 - fracY) + srcData[srcIdx2] * fracY
      let g = srcData[srcIdx1 + 1] * (1 - fracY) + srcData[srcIdx2 + 1] * fracY
      let b = srcData[srcIdx1 + 2] * (1 - fracY) + srcData[srcIdx2 + 2] * fracY
      const a = srcData[srcIdx1 + 3] * (1 - fracY) + srcData[srcIdx2 + 3] * fracY

      // Optional paper crease shadow & highlight effect
      if (showCreaseShadow && foldProgress > 0.05) {
        const seamY = trimToFoldHeight ? yTop : yTop + yOffset
        const distToSeam = y - seamY

        if (distToSeam >= -3 && distToSeam < 0) {
          // Subtle drop shadow above the fold
          const shadowFactor = 1 - (0.22 * foldProgress * (1 - Math.abs(distToSeam) / 3))
          r *= shadowFactor
          g *= shadowFactor
          b *= shadowFactor
        } else if (distToSeam >= 0 && distToSeam <= 3) {
          // Subtle paper edge rim highlight
          const highlightFactor = 1 + (0.18 * foldProgress * (1 - distToSeam / 3))
          r = Math.min(255, r * highlightFactor)
          g = Math.min(255, g * highlightFactor)
          b = Math.min(255, b * highlightFactor)
        }
      }

      dstData[dstIdx] = r
      dstData[dstIdx + 1] = g
      dstData[dstIdx + 2] = b
      dstData[dstIdx + 3] = a
    }
  }

  targetCtx.putImageData(destImageData, 0, 0)
}
