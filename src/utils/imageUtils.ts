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
