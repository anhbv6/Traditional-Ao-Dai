import React, { ReactNode } from 'react'

interface StoreLayoutProps {
    children: ReactNode;
}

function StoreLayout({children}: StoreLayoutProps) {
  return (
    <div>
        <h1>layout store</h1>
        <div>{children}</div>
    </div>
  )
}

export default StoreLayout