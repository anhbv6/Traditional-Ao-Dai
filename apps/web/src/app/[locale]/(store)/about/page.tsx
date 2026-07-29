import { Container } from '@/components/ui/container'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { AboutExperience } from '@/components/about/AboutExperience'
import React from 'react'

function About() {
  return (
    <Container as="section" className="py-8 sm:py-10">
      <Breadcrumbs />
      <AboutExperience />
    </Container>
  )
}

export default About
