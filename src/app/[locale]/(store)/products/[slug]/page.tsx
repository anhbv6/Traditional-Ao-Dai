import React from 'react'

interface DetailProductsProps {
  params: {
    slug: string;
  }
}

function DetailProducts({params}: DetailProductsProps) {
  console.log("params", params.slug);
  
  return (
    <div>DetailProducts</div>
  )
}

export default DetailProducts