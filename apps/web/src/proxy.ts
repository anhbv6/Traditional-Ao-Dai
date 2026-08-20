import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(vi|en)/:path*', '/((?!_next|_vercel|api|.*\\..*).*)']
};
