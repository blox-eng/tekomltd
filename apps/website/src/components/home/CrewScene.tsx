import { GLYPHS, type GlyphKey } from '@tekom/ui/glyphs';
import styles from './crews.module.css';

/** Where each trade's tool sits in the line drawing: [x, y, size] on the 600 x 400 canvas. */
const AT: Record<'site' | 'office', Partial<Record<GlyphKey, [number, number, number]>>> = {
    site: {
        plumb: [506, 136, 40],
        trowel: [374, 282, 40],
        boards: [464, 204, 40],
        roller: [226, 170, 40],
        tiles: [368, 346, 36],
        spatula: [275, 286, 40],
        hat: [34, 300, 40],
        brick: [94, 300, 40],
        truss: [352, 82, 38]
    },
    office: { key: [40, 150, 40], ledger: [262, 80, 40], square: [112, 214, 40], laptop: [166, 212, 44] }
};

const range = (from: number, to: number, step: number) => Array.from({ length: Math.max(0, Math.ceil((to - from) / step)) }, (_, i) => from + i * step);

function SiteScene() {
    const courses = range(256, 329, 12);
    const lines =
        'M20 340H580 M150 340V150H450V340 M150 245H450 M140 150L300 78L460 150 M300 78V150M220 114V150M380 114V150M220 114L260 150M380 114L340 150 M295 168V226M270 197H320 M270 340V268H320V340 ' +
        'M340 160H440M340 198H440M340 236H440 M352 300q12-10 24 0t24 0M352 316q12-10 24 0t24 0 ' +
        'M458 110V340M500 110V340M540 110V340M450 112H548M450 150H548M450 245H548M458 150L500 245M500 150L540 245M458 245L500 340M500 245L540 340 M526 112V136 ' +
        'M232 340L222 372H382L372 340M227 356H377M262 340L258 372M302 340V372M342 340L346 372';
    return (
        <>
            <rect className={styles.paint} x="165" y="160" width="66" height="76" />
            <g className={styles.sk}>
                <path d={lines} />
                <rect x="270" y="168" width="50" height="58" />
                {courses.map((y, row) => (
                    <path
                        key={y}
                        d={`M160 ${y}H250${range(160 + (row % 2 ? 15 : 0), 250, 30)
                            .map((x) => `M${x} ${y}V${y + 12}`)
                            .join('')}`}
                    />
                ))}
                <path
                    d={range(340, 441, 33)
                        .map((x) => `M${x} 160V236`)
                        .join('')}
                />
            </g>
        </>
    );
}

function OfficeScene() {
    return (
        <g className={styles.sk}>
            <path d="M20 340H580" />
            <rect x="370" y="80" width="180" height="150" />
            <path d="M460 80V230M362 236H558" />
            <path d="M372 200H548" />
            <path d="M110 120H330" />
            {range(118, 240, 16).map((x) => (
                <rect key={x} x={x} y={x % 32 ? 76 : 84} width="12" height={x % 32 ? 44 : 36} />
            ))}
            <path d="M220 0V30M206 44H234L228 30H212Z" />
            <rect x="90" y="255" width="240" height="8" />
            <path d="M100 263V340M320 263V340" />
            <rect x="262" y="263" width="58" height="36" />
            <path d="M282 281H300" />
            <path d="M232 255V241H290V255M236 241V235H286V241" />
            <path d="M140 296H196M196 296V268M168 296V340M150 340H186" />
            <rect x="30" y="140" width="60" height="70" />
            <path d="M60 140V132" />
            <path d="M560 340V270M548 300H572M552 270q8-24 16 0" />
        </g>
    );
}

type Props = { kind: 'site' | 'office'; tools: GlyphKey[]; active: string | null };

/** A line drawing of the building site or the office, with each trade's tool where that trade works. */
export function CrewScene({ kind, tools, active }: Props) {
    return (
        <svg className={styles.scene} viewBox="0 0 600 400" aria-hidden="true">
            {kind === 'office' ? <OfficeScene /> : <SiteScene />}
            {tools.map((tool) => {
                const at = AT[kind][tool];
                if (!at) return null;
                return (
                    <g
                        key={tool}
                        className={tool === active ? `${styles.ic} ${styles.on}` : styles.ic}
                        data-tool={tool}
                        transform={`translate(${at[0]} ${at[1]}) scale(${at[2] / 48})`}
                        // GLYPHS are trusted constants, never user input.
                        dangerouslySetInnerHTML={{ __html: GLYPHS[tool] }}
                    />
                );
            })}
        </svg>
    );
}
