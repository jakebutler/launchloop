import React from 'react'

type HeroProps = {
  productName: string
  tagline: string
  description: string
}

export const Hero: React.FC<HeroProps> = ({ productName, tagline, description }) => {
  return (
    <section className="hero">
      <p className="eyebrow">{productName}</p>
      <h1>{tagline}</h1>
      <p className="lead">{description}</p>
    </section>
  )
}
