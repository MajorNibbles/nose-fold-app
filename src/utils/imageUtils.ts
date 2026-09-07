/**
 * Loads an image from a data URL or URL, ensuring it is normalized to max dimensions
 * for 60fps performance and responsive consistency across all mobile & desktop cameras.
 */
export async function normalizeImage(
  dataUrl: string,
  maxDimension: number = 1000
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let width = img.naturalWidth || 500
      let height = img.naturalHeight || 650

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const scaledDataUrl = canvas.toDataURL('image/jpeg', 0.92)
          resolve({ dataUrl: scaledDataUrl, width, height })
          return
        }
      }

      // If already within bounds, return directly or via canvas
      resolve({ dataUrl, width, height })
    }
    img.onerror = (err) => reject(err)
    img.src = dataUrl
  })
}

/**
 * Reads a File/Blob directly using URL.createObjectURL and scales it down
 * immediately to maxDimension on an offscreen canvas.
 * This prevents high-res 12MP-48MP mobile camera photos from causing memory spikes
 * that trigger mobile browser tab crashes or page reloads.
 */
export async function fileToOptimizedDataUrl(
  file: File | Blob,
  maxDimension: number = 1000
): Promise<{ dataUrl: string; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        let width = img.naturalWidth || 600
        let height = img.naturalHeight || 800

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          throw new Error('Failed to obtain canvas context')
        }

        ctx.drawImage(img, 0, 0, width, height)
        const scaledDataUrl = canvas.toDataURL('image/jpeg', 0.90)

        // Free memory explicitly
        canvas.width = 0
        canvas.height = 0

        resolve({ dataUrl: scaledDataUrl, width, height })
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(err)
    }

    img.src = objectUrl
  })
}

/**
 * Copies a canvas to the system clipboard formatted so messaging apps
 * like WhatsApp, iMessage, and Telegram treat it as a standard photo attachment
 * (with caption input and photo preview), rather than a sticker cutout.
 *
 * WhatsApp routes images to its custom sticker engine if:
 *  1. The MIME type is image/png (the default for iOS "Lift Subject" cutout stickers).
 *  2. The image contains transparency / alpha channel.
 *
 * This function:
 *  1. Flattens the canvas over a solid white background (0 alpha / 100% opaque).
 *  2. Attempts to write image/jpeg (UTI public.jpeg) which iOS/WhatsApp strictly treats as a photo.
 *  3. Falls back to opaque image/png if the browser only permits PNG on clipboard writes.
 */
export async function copyCanvasAsNormalImage(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.write) {
    return false
  }

  // 1. Create opaque background (no alpha transparency)
  const opaqueCanvas = document.createElement('canvas')
  opaqueCanvas.width = canvas.width
  opaqueCanvas.height = canvas.height
  const ctx = opaqueCanvas.getContext('2d')
  if (!ctx) return false

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, opaqueCanvas.width, opaqueCanvas.height)
  ctx.drawImage(canvas, 0, 0)

  const toBlobPromise = (mime: string, quality?: number): Promise<Blob | null> =>
    new Promise((resolve) => opaqueCanvas.toBlob(resolve, mime, quality))

  // 2. Try writing image/jpeg first
  try {
    const clipboardItemObj = ClipboardItem as unknown as {
      supports?: (mime: string) => boolean
    }
    const supportsJpeg =
      typeof clipboardItemObj?.supports === 'function'
        ? clipboardItemObj.supports('image/jpeg')
        : true

    if (supportsJpeg) {
      const jpegBlob = await toBlobPromise('image/jpeg', 0.95)
      if (jpegBlob) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/jpeg': jpegBlob,
          }),
        ])
        return true
      }
    }
  } catch (err) {
    console.warn('Clipboard write for image/jpeg failed, trying fallback to opaque PNG:', err)
  }

  // 3. Fallback to opaque image/png
  try {
    const pngBlob = await toBlobPromise('image/png')
    if (pngBlob) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob,
        }),
      ])
      return true
    }
  } catch (err) {
    console.error('Clipboard write for opaque image/png failed:', err)
  }

  return false
}
