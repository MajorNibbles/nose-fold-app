import type { Point, Stroke, ColumnFoldMap, FoldMode } from '../types/fold'

/**
 * Smooths raw stroke points using a moving average window
 */
export function smoothStroke(points: Point[], windowSize: number = 3): Point[] {
  if (points.length <= 2) return points

  const smoothed: Point[] = [points[0]]
  const half = Math.floor(windowSize / 2)

  for (let i = 1; i < points.length - 1; i++) {
    let sumX = 0
    let sumY = 0
    let count = 0

    for (let w = -half; w <= half; w++) {
      const idx = i + w
      if (idx >= 0 && idx < points.length) {
        sumX += points[idx].x
        sumY += points[idx].y
        count++
      }
    }

    smoothed.push({
      x: sumX / count,
      y: sumY / count,
    })
  }

  smoothed.push(points[points.length - 1])
  return smoothed
}

/**
 * Helper to rasterize a stroke into column-wise Y values and determine its horizontal bounds.
 */
function rasterizeStroke(
  rawStroke: Stroke,
  width: number
): {
  yValues: Float32Array
  minX: number
  maxX: number
  leftmostPt: Point
  rightmostPt: Point
} {
  const yValues = new Float32Array(width).fill(-1)
  if (rawStroke.length === 0) {
    return {
      yValues,
      minX: 0,
      maxX: 0,
      leftmostPt: { x: 0, y: 0 },
      rightmostPt: { x: 0, y: 0 },
    }
  }

  const stroke = smoothStroke(rawStroke, 5)

  let minX = stroke[0].x
  let maxX = stroke[0].x
  for (const pt of stroke) {
    if (pt.x < minX) minX = pt.x
    if (pt.x > maxX) maxX = pt.x
  }

  let leftmostPt = stroke[0]
  let rightmostPt = stroke[0]
  for (const pt of stroke) {
    if (pt.x <= leftmostPt.x) leftmostPt = pt
    if (pt.x >= rightmostPt.x) rightmostPt = pt
  }

  const xSamples: { [col: number]: number[] } = {}

  for (let i = 0; i < stroke.length - 1; i++) {
    const p1 = stroke[i]
    const p2 = stroke[i + 1]

    const startX = Math.max(0, Math.floor(Math.min(p1.x, p2.x)))
    const endX = Math.min(width - 1, Math.ceil(Math.max(p1.x, p2.x)))

    if (Math.abs(p2.x - p1.x) < 0.001) {
      const col = Math.round(p1.x)
      if (col >= 0 && col < width) {
        if (!xSamples[col]) xSamples[col] = []
        xSamples[col].push((p1.y + p2.y) / 2)
      }
      continue
    }

    for (let col = startX; col <= endX; col++) {
      const t = (col - p1.x) / (p2.x - p1.x)
      if (t >= 0 && t <= 1) {
        const y = p1.y + t * (p2.y - p1.y)
        if (!xSamples[col]) xSamples[col] = []
        xSamples[col].push(y)
      }
    }
  }

  for (let x = 0; x < width; x++) {
    if (xSamples[x] && xSamples[x].length > 0) {
      const sum = xSamples[x].reduce((a, b) => a + b, 0)
      yValues[x] = sum / xSamples[x].length
    }
  }

  // Fill interior gaps between minX and maxX
  const startCol = Math.max(0, Math.floor(minX))
  const endCol = Math.min(width - 1, Math.ceil(maxX))
  let lastKnownY = leftmostPt.y
  for (let x = startCol; x <= endCol; x++) {
    if (yValues[x] >= 0) {
      lastKnownY = yValues[x]
    } else {
      yValues[x] = lastKnownY
    }
  }

  return { yValues, minX, maxX, leftmostPt, rightmostPt }
}

/**
 * Converts a drawn stroke into a column-wise Y value array across the canvas width.
 */
export function strokeToColumnY(
  rawStroke: Stroke,
  width: number,
  mode: FoldMode = 'crease'
): { yValues: Float32Array; activeMask: Float32Array } {
  const yValues = new Float32Array(width)
  const activeMask = new Float32Array(width)

  if (rawStroke.length === 0) {
    return { yValues, activeMask }
  }

  const data = rasterizeStroke(rawStroke, width)
  const startCol = Math.max(0, Math.floor(data.minX))
  const endCol = Math.min(width - 1, Math.ceil(data.maxX))

  for (let x = 0; x < width; x++) {
    yValues[x] = data.yValues[x]
    if (x >= startCol && x <= endCol && data.yValues[x] >= 0) {
      activeMask[x] = 1.0
    }
  }

  const isCrease = mode === 'crease' || mode === 'full-paper'

  if (isCrease) {
    // Extend horizontally to left and right edges like real folded paper
    for (let x = 0; x < startCol; x++) {
      yValues[x] = data.leftmostPt.y
      activeMask[x] = 1.0
    }
    for (let x = endCol + 1; x < width; x++) {
      yValues[x] = data.rightmostPt.y
      activeMask[x] = 1.0
    }
  } else {
    // Pinch mode: stay localized to stroke bounds with smooth cosine feathering
    const featherDist = 30
    for (let x = 0; x < startCol; x++) {
      yValues[x] = data.leftmostPt.y
      const dist = startCol - x
      if (dist < featherDist) {
        activeMask[x] = 0.5 * (1 + Math.cos((dist / featherDist) * Math.PI))
      } else {
        activeMask[x] = 0.0
      }
    }

    for (let x = endCol + 1; x < width; x++) {
      yValues[x] = data.rightmostPt.y
      const dist = x - endCol
      if (dist < featherDist) {
        activeMask[x] = 0.5 * (1 + Math.cos((dist / featherDist) * Math.PI))
      } else {
        activeMask[x] = 0.0
      }
    }
  }

  return { yValues, activeMask }
}

/**
 * Builds the complete column fold map from top and bottom strokes.
 * In 'pinch' mode (default):
 * - The longer line defines the full width of the crease.
 * - The shorter line is extended horizontally to match that width.
 * - The crease ONLY happens where the lines are drawn.
 * In 'crease' mode:
 * - Full edge-to-edge paper crease collapsing the entire canvas width.
 */
export function computeFoldMap(
  topStroke: Stroke,
  bottomStroke: Stroke,
  width: number,
  mode: FoldMode = 'crease'
): ColumnFoldMap {
  const yTop = new Float32Array(width)
  const yBottom = new Float32Array(width)
  const gap = new Float32Array(width)
  let maxGap = 0

  const isCrease = mode === 'crease' || mode === 'full-paper'
  const resolvedMode: FoldMode = isCrease ? 'crease' : 'pinch'

  if (topStroke.length < 2 || bottomStroke.length < 2) {
    return { yTop, yBottom, gap, maxGap, mode: resolvedMode }
  }

  const topData = rasterizeStroke(topStroke, width)
  const bottomData = rasterizeStroke(bottomStroke, width)

  if (isCrease) {
    // Full Crease Mode: extend both strokes across the entire canvas width (0 to width - 1)
    const rawTopY = new Float32Array(width)
    const rawBottomY = new Float32Array(width)

    const topStart = Math.max(0, Math.floor(topData.minX))
    const topEnd = Math.min(width - 1, Math.ceil(topData.maxX))
    for (let x = 0; x < width; x++) {
      if (x < topStart) rawTopY[x] = topData.leftmostPt.y
      else if (x > topEnd) rawTopY[x] = topData.rightmostPt.y
      else rawTopY[x] = topData.yValues[x] >= 0 ? topData.yValues[x] : topData.leftmostPt.y
    }

    const botStart = Math.max(0, Math.floor(bottomData.minX))
    const botEnd = Math.min(width - 1, Math.ceil(bottomData.maxX))
    for (let x = 0; x < width; x++) {
      if (x < botStart) rawBottomY[x] = bottomData.leftmostPt.y
      else if (x > botEnd) rawBottomY[x] = bottomData.rightmostPt.y
      else rawBottomY[x] = bottomData.yValues[x] >= 0 ? bottomData.yValues[x] : bottomData.leftmostPt.y
    }

    for (let x = 0; x < width; x++) {
      const y1 = Math.min(rawTopY[x], rawBottomY[x])
      const y2 = Math.max(rawTopY[x], rawBottomY[x])
      const colGap = Math.max(0, y2 - y1)
      yTop[x] = y1
      yBottom[x] = y2
      gap[x] = colGap
      if (colGap > maxGap) maxGap = colGap
    }
  } else {
    // Pinch Mode (Partial Crease):
    // The longer line defines the full width of the crease.
    // The shorter line is extended horizontally to match that width.
    // The crease ONLY happens where the lines are drawn.
    const topSpan = Math.max(0, topData.maxX - topData.minX)
    const bottomSpan = Math.max(0, bottomData.maxX - bottomData.minX)
    const isTopLonger = topSpan >= bottomSpan

    // Crease horizontal span
    let creaseMinX = isTopLonger ? topData.minX : bottomData.minX
    let creaseMaxX = isTopLonger ? topData.maxX : bottomData.maxX

    // Encompass both strokes so neither line has drawn points clipped
    creaseMinX = Math.min(creaseMinX, Math.min(topData.minX, bottomData.minX))
    creaseMaxX = Math.max(creaseMaxX, Math.max(topData.maxX, bottomData.maxX))

    const startCol = Math.max(0, Math.floor(creaseMinX))
    const endCol = Math.min(width - 1, Math.ceil(creaseMaxX))
    const creaseWidth = Math.max(1, endCol - startCol)

    // Smooth feathering at the exact boundary edges (10% of width, between 8px and 22px)
    // so the skin/paper doesn't have an unnatural 1-pixel shear tear at the ends
    const feather = Math.max(6, Math.min(22, Math.round(creaseWidth * 0.1)))

    const topStart = Math.max(0, Math.floor(topData.minX))
    const topEnd = Math.min(width - 1, Math.ceil(topData.maxX))
    const botStart = Math.max(0, Math.floor(bottomData.minX))
    const botEnd = Math.min(width - 1, Math.ceil(bottomData.maxX))

    // Outside the crease, gap is 0 (crease only happens where lines are drawn)
    // Fill default values for columns outside [startCol, endCol]
    for (let x = 0; x < startCol; x++) {
      const defaultY = Math.min(topData.leftmostPt.y, bottomData.leftmostPt.y)
      yTop[x] = defaultY
      yBottom[x] = defaultY
      gap[x] = 0
    }
    for (let x = endCol + 1; x < width; x++) {
      const defaultY = Math.min(topData.rightmostPt.y, bottomData.rightmostPt.y)
      yTop[x] = defaultY
      yBottom[x] = defaultY
      gap[x] = 0
    }

    // Inside the crease:
    // Sample lines, extending the shorter line horizontally to match the full crease width
    for (let x = startCol; x <= endCol; x++) {
      // Top line Y
      let yt: number
      if (x < topStart) {
        yt = topData.leftmostPt.y // Extended horizontally to match crease width
      } else if (x > topEnd) {
        yt = topData.rightmostPt.y // Extended horizontally to match crease width
      } else {
        yt = topData.yValues[x] >= 0 ? topData.yValues[x] : topData.leftmostPt.y
      }

      // Bottom line Y
      let yb: number
      if (x < botStart) {
        yb = bottomData.leftmostPt.y // Extended horizontally to match crease width
      } else if (x > botEnd) {
        yb = bottomData.rightmostPt.y // Extended horizontally to match crease width
      } else {
        yb = bottomData.yValues[x] >= 0 ? bottomData.yValues[x] : bottomData.leftmostPt.y
      }

      const y1 = Math.min(yt, yb)
      const y2 = Math.max(yt, yb)
      const rawGap = Math.max(0, y2 - y1)

      // Smooth cosine fade at the boundary edges
      let weight = 1.0
      if (x < startCol + feather) {
        const t = (x - startCol) / feather
        weight = 0.5 * (1 - Math.cos(t * Math.PI))
      } else if (x > endCol - feather) {
        const t = (endCol - x) / feather
        weight = 0.5 * (1 - Math.cos(t * Math.PI))
      }

      const colGap = rawGap * weight
      yTop[x] = y1
      yBottom[x] = y2
      gap[x] = colGap

      if (colGap > maxGap) {
        maxGap = colGap
      }
    }
  }

  return { yTop, yBottom, gap, maxGap, mode: resolvedMode }
}

/**
 * Generate default squiggly fold lines positioned nicely on an image
 */
export function generateDefaultNoseLines(width: number, height: number): {
  top: Point[]
  bottom: Point[]
} {
  const centerX = width * 0.5
  const span = width * 0.5
  const topY = height * 0.42
  const bottomY = height * 0.54

  const top: Point[] = []
  const bottom: Point[] = []
  const steps = 30

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = centerX - span / 2 + t * span
    // Fun squiggly curve with a couple harmonic waves
    const wave = Math.sin(t * Math.PI * 4) * (height * 0.012)
    top.push({ x, y: topY + wave })
    bottom.push({ x, y: bottomY - wave * 0.8 })
  }

  return { top, bottom }
}
