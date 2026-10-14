'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Glyph, Stamp, type GlyphKey } from '@tekom/ui';
import type { Crew } from '@/content/home';
import { STAMP_DATE } from '../stampDate';
import { CrewScene } from './CrewScene';
import styles from './crews.module.css';

type Props = { crew: Crew; flip: boolean; yearsLabel: string; stampLabel: string };

export function CrewSplit({ crew, flip, yearsLabel, stampLabel }: Props) {
    const [active, setActive] = useState<string | null>(null);
    const tools = crew.roles.map((role) => role.tool as GlyphKey);
    const photo = crew.groupPhoto;

    return (
        <div className={flip ? `${styles.split} ${styles.flip}` : styles.split} data-crew={crew.key}>
            <figure className={`${styles.group} stamped`}>
                {photo ? (
                    <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 900px) 100vw, 700px" />
                ) : (
                    <>
                        <div className={styles.lineup}>
                            <CrewScene kind={crew.scene} tools={tools} active={active} />
                        </div>
                        <Stamp label={stampLabel} date={STAMP_DATE} />
                    </>
                )}
                <figcaption>
                    <b>{crew.title}</b>
                    <span>{crew.body}</span>
                </figcaption>
            </figure>
            <ul className={styles.roles}>
                {crew.roles.map((role) => (
                    <li
                        key={role.tool}
                        tabIndex={0}
                        data-tool={role.tool}
                        onMouseEnter={() => setActive(role.tool)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(role.tool)}
                        onBlur={() => setActive(null)}
                    >
                        <Glyph name={role.tool as GlyphKey} />
                        <div>
                            <b>{role.role}</b>
                            <span className="mono">
                                {role.years} {yearsLabel}*
                            </span>
                        </div>
                        {!photo && <p>{role.quip}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
}
