import { Link } from '@/i18n/navigation';

/** The button of an update: a page of the site through the locale-aware Link, or a plain mailto:. Never red: the header owns the one primary action. */
export function CtaLink({ cta }: { cta: { label: string; href: string } }) {
    const body = (
        <>
            {cta.label}{' '}
            <span className="ar" aria-hidden="true">
                →
            </span>
        </>
    );
    return cta.href.startsWith('mailto:') ? (
        <a href={cta.href} className="ghost">
            {body}
        </a>
    ) : (
        <Link href={cta.href} className="ghost">
            {body}
        </Link>
    );
}
