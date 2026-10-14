import { Link } from '@/i18n/navigation';
import { BULGARIA_OUTLINE } from './bulgaria-outline';
import { CITY_CENTRE, COUNTRY_VIEW, projectCountry, type Pin } from './geo';
import styles from './map.module.css';

type Props = { label: string; pins: Pin[]; cityCount: number; cyrillic: boolean };

const fixed = (n: number, digits = 1) => n.toFixed(digits);

const TOWNS = [
    { en: 'SOFIA', bg: 'СОФИЯ', lng: 23.32, lat: 42.7, dx: 6, dy: 4 },
    { en: 'CHERNOMORETS', bg: 'ЧЕРНОМОРЕЦ', lng: 27.63, lat: 42.45, dx: -118, dy: 22 },
    { en: 'CHEPELARE', bg: 'ЧЕПЕЛАРЕ', lng: 24.68, lat: 41.73, dx: 10, dy: 4 },
    { en: 'RAVDA', bg: 'РАВДА', lng: 27.68, lat: 42.64, dx: -58, dy: -6 }
];
const CITY_LABEL = { en: 'STARA ZAGORA', bg: 'СТАРА ЗАГОРА', dx: -50, dy: -22 };

export function BulgariaMap({ label, pins, cityCount, cyrillic }: Props) {
    const { width, height } = COUNTRY_VIEW;
    const outline =
        'M' +
        BULGARIA_OUTLINE.map(([lng, lat]) =>
            projectCountry(lng, lat)
                .map((v) => fixed(v))
                .join(',')
        ).join('L') +
        'Z';
    const name = (town: { en: string; bg: string }) => (cyrillic ? town.bg : town.en);
    const [cx, cy] = projectCountry(CITY_CENTRE.lng, CITY_CENTRE.lat);
    const [sofiaX, sofiaY] = projectCountry(TOWNS[0]!.lng, TOWNS[0]!.lat);

    return (
        <svg className={styles.map} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}>
            <path className={styles.land} d={outline} />
            {TOWNS.map((town) => {
                const [x, y] = projectCountry(town.lng, town.lat);
                return (
                    <text key={town.en} className={styles.town} x={fixed(x + town.dx, 0)} y={fixed(y + town.dy, 0)}>
                        {name(town)}
                    </text>
                );
            })}
            <circle cx={sofiaX} cy={sofiaY} r="2.5" fill="currentColor" className={styles.town} />
            {pins.map((pin) => (
                <Link key={pin.slug} href={`/projects/${pin.slug}`} aria-label={pin.title} data-tip={pin.tip}>
                    <circle className={styles.pin} cx={fixed(pin.x)} cy={fixed(pin.y)} r="6" />
                </Link>
            ))}
            <circle className={styles.cluster} cx={cx} cy={cy} r="14" />
            <text className={styles.clusterN} x={cx} y={cy}>
                {cityCount}
            </text>
            <text className={styles.town} x={fixed(cx + CITY_LABEL.dx, 0)} y={fixed(cy + CITY_LABEL.dy, 0)}>
                {name(CITY_LABEL)}
            </text>
            <path className={styles.leader} d={`M${cx + 14},${cy} H${width - 6}`} />
        </svg>
    );
}
