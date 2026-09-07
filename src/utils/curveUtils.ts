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
 * Converts a drawn stroke into a column-wise Y value array across the canvas width.
 */
export function strokeToColumnY(
  rawStroke: Stroke,
  width: number,
  mode: FoldMode = 'full-paper'
): { yValues: Float32Array; activeMask: Float32Array } {
  const yValues = new Float32Array(width)
  const activeMask = new Float32Array(width)

  if (rawStroke.length === 0) {
    return { yValues, activeMask }
  }

  const stroke = smoothStroke(rawStroke, 5)

  // Find min and max X of the stroke
  let minX = stroke[0].x
  let maxX = stroke[0].x
  for (const pt of stroke) {
    if (pt.x < minX) minX = pt.x
    if (pt.x > maxX) maxX = pt.x
  }

  // Determine points at leftmost and rightmost X
  let leftmostPt = stroke[0]
  let rightmostPt = stroke[0]
  for (const pt of stroke) {
    if (pt.x <= leftmostPt.x) leftmostPt = pt
    if (pt.x >= rightmostPt.x) rightmostPt = pt
  }

  // Map each column x to interpolated Y
  // We collect all segments intersecting vertical line at column x
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

  // Fill in column Y values from sampled segments
  for (let x = 0; x < width; x++) {
    if (xSamples[x] && xSamples[x].length > 0) {
      // Median or average
      const sum = xSamples[x].reduce((a, b) => a + b, 0)
      yValues[x] = sum / xSamples[x].length
      activeMask[x] = 1.0
    } else {
      yValues[x] = -1 // Unset
      activeMask[x] = 0.0
    }
  }

  // Fill any interior gaps between minX and maxX
  const startCol = Math.max(0, Math.floor(minX))
  const endCol = Math.min(width - 1, Math.ceil(maxX))

  let lastKnownY = leftmostPt.y
  for (let x = startCol; x <= endCol; x++) {
    if (yValues[x] >= 0) {
      lastKnownY = yValues[x]
    } else {
      yValues[x] = lastKnownY
      activeMask[x] = 1.0
    }
  }

  // Boundary extrapolation (for full-paper vs local-pinch)
  if (mode === 'full-paper') {
    // Extend horizontally to left and right edges like real folded paper
    for (let x = 0; x < startCol; x++) {
      yValues[x] = leftmostPt.y
      activeMask[x] = 1.0
    }
    for (let x = endCol + 1; x < width; x++) {
      yValues[x] = rightmostPt.y
      activeMask[x] = 1.0
    }
  } else {
    // Local pinch with smooth falloff
    const featherDist = 60
    for (let x = 0; x < startCol; x++) {
      yValues[x] = leftmostPt.y
      const dist = startCol - x
      if (dist < featherDist) {
        // Cosine fade from 1 to 0
        activeMask[x] = 0.5 * (1 + Math.cos((dist / featherDist) * Math.PI))
      } else {
        activeMask[x] = 0.0
      }
    }

    for (let x = endCol + 1; x < width; x++) {
      yValues[x] = rightmostPt.y
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
 */
export function computeFoldMap(
  topStroke: Stroke,
  bottomStroke: Stroke,
  width: number,
  mode: FoldMode = 'full-paper'
): ColumnFoldMap {
  const topResult = strokeToColumnY(topStroke, width, mode)
  const bottomResult = strokeToColumnY(bottomStroke, width, mode)

  const yTop = new Float32Array(width)
  const yBottom = new Float32Array(width)
  const gap = new Float32Array(width)
  let maxGap = 0

  for (let x = 0; x < width; x++) {
    const rawTop = topResult.yValues[x]
    const rawBottom = bottomResult.yValues[x]

    // Ensure yTop is above yBottom
    const y1 = Math.min(rawTop, rawBottom)
    const y2 = Math.max(rawTop, rawBottom)

    const weight = Math.min(topResult.activeMask[x], bottomResult.activeMask[x])
    const rawGap = Math.max(0, y2 - y1)
    const effectiveGap = rawGap * weight

    yTop[x] = y1
    yBottom[x] = y2
    gap[x] = effectiveGap

    if (effectiveGap > maxGap) {
      maxGap = effectiveGap
    }
  }

  return { yTop, yBottom, gap, maxGap }
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
