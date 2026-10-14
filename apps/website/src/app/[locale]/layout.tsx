import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { body, display, mono } from '@tekom/ui';
import '@tekom/ui/tokens.css';
import '../globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ThemeScript } from '@/components/ThemeScript';
import { routing } from '@/i18n/routing';

export const dynamicParams = false;

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = { title: { default: 'Tekom', template: '%s · Tekom' } };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) notFound();
    setRequestLocale(locale);

    return (
        <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
            <head>
                <ThemeScript />
            </head>
            <body>
                <NextIntlClientProvider>
                    <Header locale={locale} />
                    <main id="main">{children}</main>
                    <Footer locale={locale} />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
