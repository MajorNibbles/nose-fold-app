export interface Point {
  x: number
  y: number
}

export type Stroke = Point[]

export type FoldMode = 'full-paper' | 'local-pinch'

export interface FoldCurves {
  topCurve: Point[]
  bottomCurve: Point[]
}

export interface ColumnFoldMap {
  // For each column x from 0 to width-1
  yTop: Float32Array
  yBottom: Float32Array
  gap: Float32Array
  maxGap: number
}

export type ActiveTool = 'draw-top' | 'draw-bottom' | 'folded'

export interface SampleImage {
  id: string
  name: string
  url: string
  defaultLines?: {
    top: Point[]
    bottom: Point[]
  }
}
