import { Link } from '@/i18n/navigation';
import styles from './rail.module.css';

type Props = { label: string; title: string; body: string; accent: boolean; contactLabel: string };

export function PanelSlide({ label, title, body, accent, contactLabel }: Props) {
    return (
        <div className={`${styles.slide} ${styles.panel}${accent ? ` ${styles.red}` : ''}`}>
            <span className="micro">{label}</span>
            <div>
                <h3>{title}</h3>
            </div>
            <p>{body}</p>
            <Link href="/contact" className={`${styles.go} link`}>
                {contactLabel}{' '}
                <span className="ar" aria-hidden="true">
                    →
                </span>
            </Link>
        </div>
    );
}
