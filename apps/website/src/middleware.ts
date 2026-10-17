import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

/** WordPress admin addresses are gone for good. Nothing else under /wp-* is answered here. */
const isGone = (pathname: string) => /^\/(wp-admin(\/|$)|wp-login\.php$|xmlrpc\.php$)/.test(pathname);

/** Old addresses with a fixed path, from next.config.ts. Netlify runs this before Next's own redirects (#39). */
const PAGE_REDIRECTS = new Map<string, string>(JSON.parse(process.env.PAGE_REDIRECTS ?? '[]'));

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (isGone(pathname)) return new NextResponse(null, { status: 410 });
    const destination = PAGE_REDIRECTS.get(pathname);
    if (destination) return NextResponse.redirect(new URL(destination, request.url), 301);
    return intl(request);
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|media|.*\\..*).*)', '/wp-admin/:path*', '/wp-login.php', '/xmlrpc.php']
};
