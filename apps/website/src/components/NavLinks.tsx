'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

export type NavItem = { href: string; label: string };
export type NavMenu = { label: string; menuLabel: string; items: (NavItem & { blurb: string })[] };

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function NavLinks({ items, menu, menuAfter = 0 }: { items: NavItem[]; menu?: NavMenu; menuAfter?: number }) {
    const pathname = usePathname();
    const link = ({ href, label }: NavItem) => (
        <Link key={href} href={href} aria-current={isCurrent(pathname, href) ? 'page' : undefined}>
            {label}
        </Link>
    );
    return (
        <nav className="site-nav" aria-label="Main">
            {items.slice(0, menuAfter).map(link)}
            {menu && <Menu menu={menu} pathname={pathname} />}
            {items.slice(menuAfter).map(link)}
        </nav>
    );
}

function Menu({ menu, pathname }: { menu: NavMenu; pathname: string }) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    const id = useId();
    const current = menu.items.some(({ href }) => isCurrent(pathname, href));

    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setOpen(false);
            button.current?.focus();
        };
        const onFocus = (e: FocusEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        document.addEventListener('focusin', onFocus);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('focusin', onFocus);
        };
    }, [open]);

    return (
        <div className="nav-menu" ref={root}>
            <button
                ref={button}
                type="button"
                aria-expanded={open}
                aria-controls={id}
                aria-current={current ? 'page' : undefined}
                onClick={() => setOpen((o) => !o)}
            >
                {menu.label}
                <svg viewBox="0 0 10 6" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" />
                </svg>
            </button>
            <ul id={id} aria-label={menu.menuLabel} hidden={!open}>
                {menu.items.map(({ href, label, blurb }) => (
                    <li key={href}>
                        <Link href={href} aria-current={isCurrent(pathname, href) ? 'page' : undefined}>
                            <b>{label}</b>
                            <span>{blurb}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
