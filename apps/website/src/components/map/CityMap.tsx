import { Link } from '@/i18n/navigation';
import { CITY_VIEW, scaleBarPx, type Pin } from './geo';
import styles from './map.module.css';

type Props = { label: string; pins: Pin[] };

const GRID_LINES = [1, 2, 3, 4, 5];

export function CityMap({ label, pins }: Props) {
    const { width, height } = CITY_VIEW;
    const bar = scaleBarPx(500);

    return (
        <svg className={styles.map} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}>
            <rect className={styles.land} x="0" y="0" width={width} height={height} style={{ stroke: 'none' }} />
            {GRID_LINES.map((i) => (
                <g key={i}>
                    <line className={styles.grid} x1={(i * width) / 6} y1="0" x2={(i * width) / 6} y2={height} />
                    <line className={styles.grid} x1="0" y1={(i * height) / 6} x2={width} y2={(i * height) / 6} />
                </g>
            ))}
            {pins.map((pin) => (
                <Link key={pin.slug} href={`/projects/${pin.slug}`} aria-label={pin.title} data-tip={pin.tip}>
                    <circle className={styles.pin} cx={pin.x.toFixed(1)} cy={pin.y.toFixed(1)} r="7" />
                </Link>
            ))}
            <line className={styles.scale} x1="20" y1={height - 24} x2={20 + bar} y2={height - 24} />
            <line className={styles.scale} x1="20" y1={height - 29} x2="20" y2={height - 19} />
            <line className={styles.scale} x1={20 + bar} y1={height - 29} x2={20 + bar} y2={height - 19} />
            <text className={styles.scaleText} x="20" y={height - 34}>
                500 m
            </text>
        </svg>
    );
}
