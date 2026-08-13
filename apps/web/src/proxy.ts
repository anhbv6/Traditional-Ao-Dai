import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function getLocaleFromPathname(pathname: string) {
  const segment = pathname.split('/')[1];
  return routing.locales.includes(segment as (typeof routing.locales)[number]) ? segment : undefined;
}

function isLoginPath(pathname: string) {
  return pathname === '/login' || routing.locales.some((locale) => pathname === `/${locale}/login`);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthToken = Boolean(request.cookies.get('accessToken')?.value || request.cookies.get('refreshToken')?.value);

  if (hasAuthToken && isLoginPath(pathname)) {
    const locale = getLocaleFromPathname(pathname);
    const url = request.nextUrl.clone();
    url.pathname = locale ? `/${locale}` : '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(vi|en)/:path*', '/((?!_next|_vercel|api|.*\\..*).*)']
};
