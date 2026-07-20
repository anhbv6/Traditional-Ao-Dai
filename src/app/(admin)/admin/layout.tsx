import React, { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayout({children}: AdminLayoutProps) {
  return (
    <div>
        <h1>AdminLayout</h1>
        <div>{children}</div>
    </div>
  )
}

export default AdminLayout