import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const CLIENT_AUTH_ROUTES = new Set([
  '/login',
  '/signin',
  '/forgot',
  '/changePassword',
]);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Phân tích locale và path thuần không chứa locale
  const pathnameSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathnameSegments[0];
  const isLocale = routing.locales.includes(firstSegment as any);
  const currentLocale = isLocale ? firstSegment : routing.defaultLocale;
  const pathWithoutLocale = isLocale
    ? `/${pathnameSegments.slice(1).join('/')}`
    : pathname;

  // 2. Đọc cookie xác thực
  const adminToken = request.cookies.get('admin_token')?.value;
  const userLoggedIn =
    request.cookies.get('user_logged_in')?.value ||
    request.cookies.get('refreshToken')?.value;
  const authRole = request.cookies.get('auth_role')?.value;

  // 3. Bảo vệ khu vực Admin (/admin, /admin/dashboard, /admin/staff...)
  if (pathWithoutLocale === '/admin' || pathWithoutLocale.startsWith('/admin/')) {
    const isLoginPage = pathWithoutLocale === '/admin/login';

    if (isLoginPage) {
      if (adminToken) {
        return NextResponse.redirect(
          new URL(`/${currentLocale}/admin/dashboard`, request.url)
        );
      }
      return intlMiddleware(request);
    }

    // Nếu tài khoản hiện tại là Khách hàng (CUSTOMER) mà cố truy cập vào admin -> chuyển sang 403 Forbidden
    if (authRole === 'CUSTOMER' && !adminToken) {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/403`, request.url)
      );
    }

    if (!adminToken) {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/admin/login`, request.url)
      );
    }

    // Kiểm tra quyền Super Admin đối với các route đặc thù (Nhân sự & Voucher)
    const isSuperAdminRoute =
      pathWithoutLocale === '/admin/staff' ||
      pathWithoutLocale.startsWith('/admin/staff/') ||
      pathWithoutLocale === '/admin/vouchers' ||
      pathWithoutLocale.startsWith('/admin/vouchers/');

    if (isSuperAdminRoute && authRole === 'STAFF') {
      // Nhân viên Staff không có quyền vào Nhân sự & Voucher -> redirect về dashboard
      return NextResponse.redirect(
        new URL(`/${currentLocale}/admin/dashboard`, request.url)
      );
    }

    return intlMiddleware(request);
  }

  // 4. Bảo vệ trang cá nhân người dùng (/profile, /profile/orders...)
  if (pathWithoutLocale === '/profile' || pathWithoutLocale.startsWith('/profile/')) {
    if (!userLoggedIn && !adminToken) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return intlMiddleware(request);
  }

  // 5. Chuyển hướng khi người dùng đã login cố vào lại các trang auth
  if (CLIENT_AUTH_ROUTES.has(pathWithoutLocale)) {
    if (userLoggedIn) {
      return NextResponse.redirect(new URL(`/${currentLocale}`, request.url));
    }
    return intlMiddleware(request);
  }

  // 6. Cho phép next-intl xử lý định tuyến đa ngôn ngữ cho tất cả các trang còn lại
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
