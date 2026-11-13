import type { Announcement as AnnouncementView } from '@/content/announcement';
import { formatDate } from '@/components/projects/Progress';
import { CtaLink } from '@/components/CtaLink';
import { Link } from '@/i18n/navigation';
import styles from './home.module.css';

/** One update the owner put on the home page with `home: true`. With none, the home page has no band. */
export function Announcement({ announcement: a, label }: { announcement: AnnouncementView; label: string }) {
    return (
        <section className={`wrap ${styles.news}`} aria-label={label} data-announcement>
            <p className="micro">
                <time dateTime={a.date}>{formatDate(a.date)}</time> · <Link href={`/projects/${a.project.slug}`}>{a.project.title}</Link>
            </p>
            <p className={styles.newsLead} lang={a.fallback ? 'bg' : undefined}>
                {a.lead}
            </p>
            {a.cta && <CtaLink cta={a.cta} />}
        </section>
    );
}
