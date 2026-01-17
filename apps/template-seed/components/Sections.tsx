import React from 'react'

type Section = {
  title: string
  body: string
}

type SectionsProps = {
  sections: Section[]
}

export const Sections: React.FC<SectionsProps> = ({ sections }) => {
  return (
    <section className="sections">
      {sections.map((section) => (
        <div key={section.title} className="section-card">
          <h3>{section.title}</h3>
          <p>{section.body}</p>
        </div>
      ))}
    </section>
  )
}
