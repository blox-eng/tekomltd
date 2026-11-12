import { useId } from 'react';
import { useTranslations } from 'next-intl';
import Markdown from 'react-markdown';
import { Glyph } from '@tekom/ui';
import type { ProgressView, StageView } from '@/content/progress';
import { SquareImage } from './SquareImage';
import styles from './projects.module.css';

/** `2026-11-01` → `01.11.2026`, the same in every locale. */
export const formatDate = (date: string) => date.split('-').reverse().join('.');

/** The "в строеж" label: a hard-hat glyph and the word, never colour alone. */
export function InProgressLabel() {
    const t = useTranslations('project');
    return (
        <span className={styles.building}>
            <Glyph name="hat" />
            {t('inProgress')}
        </span>
    );
}

export function Progress({ progress }: { progress: ProgressView }) {
    const t = useTranslations('project');
    const stagesId = useId();
    const stageName = (stage: StageView) => stage.label ?? t(`stage.${stage.key!}`);
    const working = progress.status === 'in_progress';
    // Once the work is done, the expected quarter and the note are history: show neither.
    const expected = working ? progress.expected : null;
    const note = working ? progress.note : null;
    const { lastUpdate } = progress;
    const showLog = working || progress.updates.length > 0;
    const inBulgarian = progress.stages.some((s) => s.labelFallback) || progress.updates.some((u) => u.fallback) || (note !== null && progress.noteFallback);

    return (
        <section className={styles.progress} data-progress>
            <div className={styles.phead}>
                {working && <InProgressLabel />}
                {(expected || progress.permit) && (
                    <dl className="facts">
                        {expected && (
                            <>
                                <dt>{t('expected')}</dt>
                                <dd className="mono">{t('quarter', expected)}</dd>
                            </>
                        )}
                        {progress.permit && (
                            <>
                                <dt>{t('permit')}</dt>
                                <dd>{progress.permit}</dd>
                            </>
                        )}
                    </dl>
                )}
            </div>
            {inBulgarian && <p className={`lang-note ${styles.note}`}>{t('inBulgarian')}</p>}
            <h2 className="micro" id={stagesId}>
                {t('stagesTitle')}
            </h2>
            <ol className={styles.ladder} aria-labelledby={stagesId}>
                {progress.stages.map((stage, i) => (
                    <li key={i} data-state={stage.state}>
                        <span className={styles.mark} aria-hidden="true" />
                        <span lang={stage.labelFallback ? 'bg' : undefined}>{stageName(stage)}</span>
                        <span className={`${styles.when} mono`}>
                            {stage.state === 'done' && (
                                <>
                                    <span className={styles.sr}>{t('stageDone', { date: formatDate(stage.done!) })}</span>
                                    <time dateTime={stage.done!} aria-hidden="true">
                                        {formatDate(stage.done!)}
                                    </time>
                                </>
                            )}
                            {stage.state === 'active' && t('stageActive')}
                            {stage.state === 'next' && <span className={styles.sr}>{t('stageNext')}</span>}
                        </span>
                    </li>
                ))}
            </ol>
            {showLog && (
                <>
                    <h2 className="micro">{t('updatesTitle')}</h2>
                    <p className={`${styles.last} mono`}>{lastUpdate ? t('lastUpdate', { date: formatDate(lastUpdate) }) : t('noUpdates')}</p>
                </>
            )}
            {note && (
                <p className={styles.pnote} lang={progress.noteFallback ? 'bg' : undefined}>
                    {note}
                </p>
            )}
            {progress.updates.map((update) => (
                <article key={update.date} className={styles.update}>
                    <time dateTime={update.date} className="mono">
                        {formatDate(update.date)}
                    </time>
                    <div className="prose" lang={update.fallback ? 'bg' : undefined}>
                        <Markdown>{update.body}</Markdown>
                    </div>
                    {update.photos.length > 0 && (
                        <ul className={styles.gallery}>
                            {update.photos.map((photo) => (
                                <li key={photo.src}>
                                    <a href={photo.src} aria-label={t('fullPhoto', { alt: photo.alt || formatDate(update.date) })}>
                                        <SquareImage image={{ ...photo, focus: 'center' }} sizes="(max-width: 520px) 100vw, (max-width: 860px) 50vw, 420px" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            ))}
        </section>
    );
}
