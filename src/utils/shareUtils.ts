export interface ShareResult {
  success: boolean
  method: 'native' | 'whatsapp' | 'clipboard'
}

export async function shareFaceFoldApp(): Promise<ShareResult> {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://majornibbles.github.io/nose-fold-app/'

  const shareText = 'Check out this hilarious new app that lets you fold your face! 😂👃'

  // 1. Try Native Web Share API (opens system share sheet with WhatsApp, Messages, etc. on mobile)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'FaceFold',
        text: shareText,
        url: shareUrl,
      })
      return { success: true, method: 'native' }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'native' }
      }
    }
  }

  // 2. Direct WhatsApp share fallback
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText} ${shareUrl}`
  )}`

  // Also copy to clipboard
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    }
  } catch {}

  window.open(whatsappUrl, '_blank')
  return { success: true, method: 'whatsapp' }
}
