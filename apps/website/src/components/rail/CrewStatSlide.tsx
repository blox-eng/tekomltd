import { Glyph, Stamp, type GlyphKey } from '@tekom/ui';
import styles from './rail.module.css';

type Props = { value: string; unit: string; body: string; tools: GlyphKey[]; stampLabel: string };

const STAMP_DATE = '10 · 2026';

export function CrewStatSlide({ value, unit, body, tools, stampLabel }: Props) {
    return (
        <div className={`${styles.slide} ${styles.crew}`} data-crew-stat>
            <div className={styles.collage} aria-hidden="true">
                {tools.map((tool, i) => (
                    <span key={`${tool}-${i}`}>
                        <Glyph name={tool} />
                    </span>
                ))}
            </div>
            <Stamp label={stampLabel} date={STAMP_DATE} />
            <div className={styles.body}>
                <div className={styles.big}>
                    {value}
                    <small>{unit}</small>
                </div>
                <p>{body}</p>
            </div>
        </div>
    );
}
