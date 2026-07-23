import { Container } from '@/components/ui/container'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import React from 'react'

function Faqs() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <div>Faqs</div>
    </Container>
  )
}

export default Faqs