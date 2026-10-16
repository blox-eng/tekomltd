import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import { body, display, mono } from '@tekom/ui';
import '@tekom/ui/tokens.css';
import '../globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { ThemeScript } from '@/components/ThemeScript';
import { getSettings } from '@/content/settings';
import { routing } from '@/i18n/routing';
import { businessJsonLd } from '@/lib/jsonld';
import { brandName, SITE_URL } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const brand = brandName((await params).locale as Locale);
    return { metadataBase: new URL(SITE_URL), title: { default: brand, template: `%s · ${brand}` } };
}

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
                <JsonLd data={businessJsonLd(getSettings(locale), locale)} />
                <NextIntlClientProvider>
                    <Header locale={locale} />
                    <main id="main">{children}</main>
                    <Footer locale={locale} />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
