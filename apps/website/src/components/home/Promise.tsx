import { getTranslations } from 'next-intl/server';
import styles from './home.module.css';

type Props = { locale: string; promises: { title: string; body: string }[] };

export async function PromiseSection({ locale, promises }: Props) {
    const t = await getTranslations({ locale, namespace: 'why' });
    return (
        <section className={styles.why}>
            <div>
                <h2>{t.rich('h', { em: (chunks) => <em>{chunks}</em> })}</h2>
                <p className={styles.lead}>{t('p')}</p>
            </div>
            <ul className={styles.risks}>
                {promises.map((promise) => (
                    <li key={promise.title}>
                        <b>{promise.title}</b>
                        <span>{promise.body}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
