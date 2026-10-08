import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { AUTH_COOKIES } from '@repo/shared';
import { verifyAccessToken } from './lib/jwt.server';

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
  const isLocale = (routing.locales as readonly string[]).includes(firstSegment);
  const currentLocale = isLocale ? firstSegment : routing.defaultLocale;
  const pathWithoutLocale = isLocale
    ? `/${pathnameSegments.slice(1).join('/')}`
    : pathname;

  // 2. Đọc cookie xác thực
  // admin_token phải được xác minh chữ ký RS256 + hạn dùng; vai trò quản trị lấy từ payload đã ký,
  // KHÔNG lấy từ cookie auth_role (client có thể tự sửa)
  const adminPayload = verifyAccessToken(request.cookies.get(AUTH_COOKIES.adminToken)?.value);
  const adminRole =
    adminPayload?.role === 'ADMIN' || adminPayload?.role === 'STAFF' ? adminPayload.role : null;
  const hasValidAdminToken = Boolean(adminRole);
  // Cùng origin với API nên proxy đọc được cookie httpOnly `refreshToken` do Backend đặt
  const userLoggedIn = Boolean(request.cookies.get(AUTH_COOKIES.refreshToken)?.value);

  // 3. Bảo vệ khu vực Admin (/admin, /admin/dashboard, /admin/staff...)
  if (pathWithoutLocale === '/admin' || pathWithoutLocale.startsWith('/admin/')) {
    const isLoginPage = pathWithoutLocale === '/admin/login';

    if (isLoginPage) {
      // Phiên đã bị thu hồi phía server (đăng xuất ở nơi khác, bị khóa...) -> xóa cookie cũ, ở lại trang đăng nhập
      if (request.nextUrl.searchParams.get('expired') === '1') {
        const response = intlMiddleware(request);
        response.cookies.delete(AUTH_COOKIES.adminToken);
        response.cookies.delete(AUTH_COOKIES.adminSessionHint);
        return response;
      }
      if (hasValidAdminToken) {
        return NextResponse.redirect(
          new URL(`/${currentLocale}/admin/dashboard`, request.url)
        );
      }
      return intlMiddleware(request);
    }

    // Khách hàng đang đăng nhập (không có phiên quản trị) cố truy cập admin -> 403 Forbidden
    if (userLoggedIn && !hasValidAdminToken) {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/403`, request.url)
      );
    }

    if (!hasValidAdminToken) {
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

    if (isSuperAdminRoute && adminRole !== 'ADMIN') {
      // Nhân viên Staff không có quyền vào Nhân sự & Voucher -> redirect về dashboard
      return NextResponse.redirect(
        new URL(`/${currentLocale}/admin/dashboard`, request.url)
      );
    }

    return intlMiddleware(request);
  }

  // 4. Bảo vệ trang cá nhân khách hàng (/profile, /profile/orders...)
  if (pathWithoutLocale === '/profile' || pathWithoutLocale.startsWith('/profile/')) {
    if (!userLoggedIn) {
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
