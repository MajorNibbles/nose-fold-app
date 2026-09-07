declare module 'gifenc' {
  export type PixelBuffer = Uint8Array | Uint8ClampedArray | number[]

  export interface GIFEncoderOptions {
    auto?: boolean
    initialCapacity?: number
  }

  export interface WriteFrameOptions {
    palette?: number[][] | Uint8Array | number[]
    delay?: number
    repeat?: number
    dispose?: number
    transparent?: boolean
    transparentIndex?: number
  }

  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array | number[],
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
  }

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance
  export function quantize(rgba: PixelBuffer, maxColors?: number, options?: object): number[][]
  export function applyPalette(rgba: PixelBuffer, palette: number[][] | Uint8Array, format?: string): Uint8Array
}
