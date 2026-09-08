/**
 * Google Analytics GA4 custom event tracking helper
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      ;(window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', eventName, params)
    }
  } catch {
    // Fail silently without disrupting user experience
  }
}
