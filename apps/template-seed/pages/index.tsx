import fs from 'fs'
import path from 'path'
import { useEffect, useState } from 'react'
import type { GetStaticProps } from 'next'
import { CTA } from '../components/CTA'
import { Hero } from '../components/Hero'
import { LeadForm } from '../components/LeadForm'
import { Sections } from '../components/Sections'
import { initAnalytics, trackEvent } from '../lib/analytics'
import { getExperimentVariant, onExperimentUpdate } from '../lib/experiments'
import { comparisonTemplate } from '../templates/comparison'
import { singleCtaTemplate } from '../templates/single-cta'
import { storyTemplate } from '../templates/story'

type Section = {
  title: string
  body: string
}

type SiteConfig = {
  archetype: 'single-cta' | 'story' | 'comparison'
  productName: string
  tagline: string
  ctaLabel: string
  heroDescription: string
  sections: Section[]
}

type HomeProps = {
  config: SiteConfig
  templateAccent: string
}

const templateLookup = {
  'single-cta': singleCtaTemplate,
  story: storyTemplate,
  comparison: comparisonTemplate
}

export default function Home({ config, templateAccent }: HomeProps) {
  initAnalytics()
  const [variant, setVariant] = useState(() => getExperimentVariant())

  useEffect(() => {
    onExperimentUpdate(setVariant)
  }, [])

  useEffect(() => {
    trackEvent('experiment_view', { variant })
  }, [variant])

  return (
    <main className="page">
      <Hero
        productName={config.productName}
        tagline={variant === 'B' ? `${config.tagline} for global teams` : config.tagline}
        description={config.heroDescription}
      />
      <p className="accent">
        {variant === 'B' ? `${templateAccent} with localized messaging.` : templateAccent}
      </p>
      <div className="cta-row">
        <CTA label={config.ctaLabel} />
      </div>
      <LeadForm ctaLabel={config.ctaLabel} experimentVariant={variant} />
      <Sections sections={config.sections} />
    </main>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const configPath = path.join(process.cwd(), 'site.config.json')
  const raw = fs.readFileSync(configPath, 'utf-8')
  const config = JSON.parse(raw) as SiteConfig

  const template = templateLookup[config.archetype]

  return {
    props: {
      config,
      templateAccent: template.heroAccent
    }
  }
}
