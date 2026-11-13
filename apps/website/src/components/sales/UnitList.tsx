'use client';

import { useEffect, useId, useState } from 'react';
import { Glyph, STATUS_GLYPHS } from '@tekom/ui';
import type { UnitStatus, UnitType } from '@/content/schema';
import { Link } from '@/i18n/navigation';
import styles from './sales.module.css';

export type UnitRow = {
    slug: string;
    label: string;
    type: UnitType;
    floors: string[];
    floorNames: string;
    rooms: number | null;
    area: string;
    status: UnitStatus;
    statusWord: string;
};
type Option = { value: string; label: string };
type Words = {
    title: string;
    type: string;
    floor: string;
    rooms: string;
    all: string;
    onlyFree: string;
    noneFree: string;
    noneMatch: string;
    col: Record<'unit' | 'floor' | 'rooms' | 'area' | 'status', string>;
};
type Props = { href: string; rows: UnitRow[]; types: Option[]; floors: Option[]; rooms: Option[]; words: Words };

/** Every unit as a plain table. The filters appear only once the script runs, so a page without it never shows dead controls. */
export function UnitList({ href, rows, types, floors, rooms, words }: Props) {
    const id = useId();
    const [ready, setReady] = useState(false);
    const [type, setType] = useState('');
    const [floor, setFloor] = useState('');
    const [room, setRoom] = useState('');
    const [onlyFree, setOnlyFree] = useState(false);
    useEffect(() => setReady(true), []);

    const shown = rows.filter(
        (r) => (!type || r.type === type) && (!floor || r.floors.includes(floor)) && (!room || String(r.rooms) === room) && (!onlyFree || r.status === 'free')
    );
    const select = (key: string, label: string, value: string, set: (v: string) => void, options: Option[]) => (
        <label className={styles.filter}>
            <span className="micro">{label}</span>
            <select id={`${id}-${key}`} value={value} onChange={(e) => set(e.target.value)}>
                <option value="">{words.all}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );

    return (
        <section className={styles.list} data-units aria-labelledby={`${id}-title`}>
            <h2 className="micro" id={`${id}-title`}>
                {words.title}
            </h2>
            {ready && (
                <div className={styles.filters}>
                    {types.length > 1 && select('type', words.type, type, setType, types)}
                    {floors.length > 1 && select('floor', words.floor, floor, setFloor, floors)}
                    {rooms.length > 1 && select('rooms', words.rooms, room, setRoom, rooms)}
                    <label className={styles.check}>
                        <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
                        {words.onlyFree}
                    </label>
                </div>
            )}
            <div className={styles.tableWrap}>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">{words.col.unit}</th>
                            <th scope="col">{words.col.floor}</th>
                            <th scope="col">{words.col.rooms}</th>
                            <th scope="col">{words.col.area}</th>
                            <th scope="col">{words.col.status}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((r) => (
                            <tr key={r.slug} data-status={r.status}>
                                <th scope="row">
                                    <Link href={`${href}/${r.slug}`}>{r.label}</Link>
                                </th>
                                <td>{r.floorNames}</td>
                                <td className="mono">{r.rooms ?? '—'}</td>
                                <td className="mono">{r.area} m²</td>
                                <td>
                                    <span className={styles.status} data-status={r.status}>
                                        <Glyph name={STATUS_GLYPHS[r.status]} />
                                        {r.statusWord}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {shown.length === 0 && <p className={styles.none}>{onlyFree ? words.noneFree : words.noneMatch}</p>}
        </section>
    );
}
