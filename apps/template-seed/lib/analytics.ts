import posthog from 'posthog-js'

let initialized = false

export const initAnalytics = () => {
  if (typeof window === 'undefined') {
    return
  }
  if (initialized) {
    return
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!key) {
    console.warn('PostHog key missing; analytics disabled')
    initialized = true
    return
  }

  posthog.init(key, {
    api_host: host || 'https://app.posthog.com',
    capture_pageview: true
  })
  initialized = true
}

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (!initialized) {
    initAnalytics()
  }
  if (posthog.__loaded) {
    posthog.capture(event, properties)
  } else {
    console.log(`[analytics] ${event}`, properties || {})
  }
}
