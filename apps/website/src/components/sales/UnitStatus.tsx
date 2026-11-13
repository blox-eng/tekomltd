import { useTranslations } from 'next-intl';
import { Glyph, STATUS_GLYPHS } from '@tekom/ui';
import type { UnitStatus as Status } from '@/content/schema';
import styles from './sales.module.css';

/** Glyph and word, never colour alone (DESIGN.md §0.4). */
export function UnitStatus({ status }: { status: Status }) {
    const t = useTranslations('sales');
    return (
        <span className={styles.status} data-status={status}>
            <Glyph name={STATUS_GLYPHS[status]} />
            {t(`status.${status}`)}
        </span>
    );
}
