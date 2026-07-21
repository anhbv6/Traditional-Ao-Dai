import Link from 'next/link';
import React from 'react';

export default function NotFound() {
  return (
    <html lang="vi">
      <head>
        <title>404 - Trang không tìm thấy</title>
      </head>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold mb-4">404 - Trang không tồn tại</h1>
          <Link href="/" className="button-action rounded">
            Quay lại trang chủ
          </Link>
        </div>
      </body>
    </html>
  );
}