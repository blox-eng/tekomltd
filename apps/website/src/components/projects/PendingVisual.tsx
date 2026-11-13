import { useTranslations } from 'next-intl';
import { Stamp } from '@tekom/ui';
import { STAMP_DATE } from '../stampDate';
import styles from './projects.module.css';

/**
 * Stands in for the photo of a project in progress that has none yet: a `--wall` field, a faint drawing of a
 * building whose shape is still dashed, and the stamp on hover, as the crew scenes do on the home page.
 */
export function PendingVisual() {
    const t = useTranslations('project');
    return (
        <div className={`${styles.pending} stamped`} role="img" aria-label={t('renderPending')} data-pending>
            <svg viewBox="0 0 120 120" aria-hidden="true">
                <path d="M8 104h104" />
                <path d="M34 104V46h34V34h22v70" strokeDasharray="3 3" />
                <path d="M42 56h8M56 56h6M42 68h8M56 68h6M42 80h8M56 80h6M76 46h8M76 58h8M76 70h8" strokeDasharray="2 2" />
                <path d="M94 104V40M102 104V40M94 52h8M94 64h8M94 76h8M94 88h8M94 52l8 12M94 76l8 12" />
                <path d="M20 104V16M14 20h62M20 16l6 4M60 20v16M56 36h8M14 20v6h6" />
            </svg>
            <Stamp label={t('renderPending')} date={STAMP_DATE} />
        </div>
    );
}
