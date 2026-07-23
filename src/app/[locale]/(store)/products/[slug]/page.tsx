import { Container } from '@/components/ui/container'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import React from 'react'

interface DetailProductsProps {
  params: Promise<{
    slug: string;
  }>;
}

async function DetailProducts({ params }: DetailProductsProps) {
  const { slug } = await params;
  
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <div>DetailProducts: {slug}</div>
    </Container>
  )
}

export default DetailProducts