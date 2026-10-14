import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

/** WordPress admin addresses are gone for good. Nothing else under /wp-* is answered here. */
const isGone = (pathname: string) => /^\/(wp-admin(\/|$)|wp-login\.php$|xmlrpc\.php$)/.test(pathname);

export default function middleware(request: NextRequest) {
    if (isGone(request.nextUrl.pathname)) return new NextResponse(null, { status: 410 });
    return intl(request);
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|media|.*\\..*).*)', '/wp-admin/:path*', '/wp-login.php', '/xmlrpc.php']
};
