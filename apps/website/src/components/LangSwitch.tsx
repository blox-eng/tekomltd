'use client';

import { useLocale } from 'next-intl';
import { LOCALES } from '@tekom/i18n';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LangSwitch() {
    const current = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="lang" role="group" aria-label="Language">
            {LOCALES.map((locale) => (
                <button key={locale} type="button" aria-pressed={locale === current} onClick={() => router.replace(pathname, { locale })}>
                    {locale.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
