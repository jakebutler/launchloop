import React, { useState } from 'react'
import { trackEvent } from '../lib/analytics'
import type { ExperimentVariant } from '../lib/experiments'

type LeadFormProps = {
  ctaLabel: string
  experimentVariant?: ExperimentVariant
}

export const LeadForm: React.FC<LeadFormProps> = ({ ctaLabel, experimentVariant }) => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <form
      className="lead-form"
      onFocus={() => trackEvent('lead_form_start')}
      onSubmit={(event) => {
        event.preventDefault()
        trackEvent('lead_submit', { email })
        trackEvent('experiment_convert', { variant: experimentVariant || 'A' })
        setSubmitted(true)
      }}
    >
      <label htmlFor="email">Email</label>
      <div className="lead-input">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit">{ctaLabel}</button>
      </div>
      {submitted && <p className="thanks">Thanks — we will be in touch soon.</p>}
    </form>
  )
}
