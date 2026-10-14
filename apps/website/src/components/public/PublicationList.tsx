'use client';

import { useState } from 'react';

export type PublicationRow = {
    key: string;
    kind: string;
    title: string;
    href: string;
    date: string;
    dateLabel: string;
    info: string;
};

type Props = {
    rows: PublicationRow[];
    kinds: { kind: string; label: string }[];
    allLabel: string;
    classes: { filters: string; docs: string; meta: string };
};

/** The full list is in the HTML; the buttons only hide rows, so the page works without JavaScript. */
export function PublicationList({ rows, kinds, allLabel, classes }: Props) {
    const [active, setActive] = useState<string | null>(null);
    const options = [{ kind: null, label: allLabel }, ...kinds];

    return (
        <>
            <div className={classes.filters} role="group">
                {options.map(({ kind, label }) => (
                    <button key={kind ?? 'all'} type="button" aria-pressed={active === kind} onClick={() => setActive(kind)}>
                        {label}
                    </button>
                ))}
            </div>
            <ul className={classes.docs}>
                {rows.map((row) => (
                    <li key={row.key} hidden={active !== null && row.kind !== active}>
                        <a href={row.href}>{row.title}</a>
                        <span className={`${classes.meta} mono`}>
                            <time dateTime={row.date}>{row.dateLabel}</time> · {row.info}
                        </span>
                    </li>
                ))}
            </ul>
        </>
    );
}
