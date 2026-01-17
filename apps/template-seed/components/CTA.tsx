import React from 'react'
import { trackEvent } from '../lib/analytics'

type CTAProps = {
  label: string
}

export const CTA: React.FC<CTAProps> = ({ label }) => {
  return (
    <button
      className="cta"
      onClick={() => trackEvent('cta_click', { label })}
    >
      {label}
    </button>
  )
}
