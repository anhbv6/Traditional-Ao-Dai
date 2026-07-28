import { Container } from '@/components/ui/container'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import React from 'react'

function About() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <div>About</div>
    </Container>
  )
}

export default About