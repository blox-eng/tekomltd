import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import bg from '@tekom/i18n/messages/bg.json';
import de from '@tekom/i18n/messages/de.json';
import en from '@tekom/i18n/messages/en.json';
import { routing } from './routing';

const messages = { bg, en, de };

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
    return { locale, messages: messages[locale] };
});
