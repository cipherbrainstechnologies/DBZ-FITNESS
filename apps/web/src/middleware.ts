import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(fr|es)/:path*', '/((?!api|health|_next|_vercel|.*\\..*).*)'],
};
