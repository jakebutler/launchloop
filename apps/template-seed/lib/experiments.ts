import posthog from 'posthog-js'

export type ExperimentVariant = 'A' | 'B'

const flagKey = 'headlineHeroTest'

export const getExperimentVariant = (): ExperimentVariant => {
  if (typeof window === 'undefined') {
    return 'A'
  }
  if (!posthog.__loaded) {
    return 'A'
  }
  const flag = posthog.getFeatureFlag(flagKey)
  return flag === 'variant-B' ? 'B' : 'A'
}

export const onExperimentUpdate = (callback: (variant: ExperimentVariant) => void) => {
  if (typeof window === 'undefined') {
    callback('A')
    return
  }
  if (!posthog.__loaded) {
    callback('A')
    return
  }
  posthog.onFeatureFlags(() => {
    callback(getExperimentVariant())
  })
}
