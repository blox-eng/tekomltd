'use client';

import { Link, usePathname } from '@/i18n/navigation';

export type NavItem = { href: string; label: string };

export function NavLinks({ items }: { items: NavItem[] }) {
    const pathname = usePathname();
    return (
        <nav className="site-nav" aria-label="Main">
            {items.map(({ href, label }) => (
                <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}>
                    {label}
                </Link>
            ))}
        </nav>
    );
}
