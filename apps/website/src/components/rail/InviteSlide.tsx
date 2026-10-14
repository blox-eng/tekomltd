import { Glyph, TurningWord } from '@tekom/ui';
import { Link } from '@/i18n/navigation';
import styles from './rail.module.css';

type Props = { label: string; lead: string; turns: string[]; body: string; contactLabel: string };

/** An empty plot on the rail: the next photo here could be the visitor's own project. */
export function InviteSlide({ label, lead, turns, body, contactLabel }: Props) {
    return (
        <div className={`${styles.slide} ${styles.invite}`} data-rail-invite>
            <Glyph name="key" className={styles.inviteGlyph} />
            <span className="micro">{label}</span>
            <div>
                <h3>
                    <TurningWord start={lead} turns={turns} />
                </h3>
                <p>{body}</p>
                <Link href="/contact" className={`${styles.go} link`}>
                    {contactLabel}{' '}
                    <span className="ar" aria-hidden="true">
                        →
                    </span>
                </Link>
            </div>
        </div>
    );
}
