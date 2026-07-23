import { Container } from '@/components/ui/container'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import React from 'react'

function Contact() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <div>Contact</div>
    </Container>
  )
}

export default Contact