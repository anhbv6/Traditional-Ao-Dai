import Link from 'next/link'
import React from 'react'

function notFound() {
  return (
    <div>
        <h1>notFound</h1>
        <Link href={"/"}>Quay lại trang chủ</Link>
    </div>
  )
}

export default notFound