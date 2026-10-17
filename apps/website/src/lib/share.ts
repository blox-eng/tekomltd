import { createHash } from 'node:crypto';
import type { Locale } from '@tekom/i18n';
import type { Focus } from '../content/cards';
import { getHome } from '../content/home';
import { defaultRoot, type Img } from '../content/load';
import type { ProjectDetail } from '../content/projects';
import type { ServiceDetail } from '../content/services';
import { getSettings } from '../content/settings';
import { brandName } from './seo';

/** The size Facebook, LinkedIn, X, WhatsApp and Viber all show uncropped. */
export const SHARE_SIZE = { width: 1200, height: 630 } as const;

/** Where scripts/share-images.ts writes the images, under public/. */
export const SHARE_DIR = 'og';

export type SharePhoto = Img & { focus?: Focus };

export type ShareImage = { url: string; width: number; height: number; alt: string };

/** The site's photo: the one set in settings, else the first project on the rail. */
export const sitePhoto = (locale: Locale, root: string = defaultRoot()): SharePhoto | null =>
    getSettings(locale, root).ogImage ?? getHome(locale, root).rail[0]?.cover ?? null;

export const projectPhoto = (project: ProjectDetail): SharePhoto => project.ogImage ?? project.cover;

export const servicePhoto = (service: ServiceDetail): SharePhoto => service.cover.cover;

/** Content-addressed: a new photo, focus or wordmark gets a new URL, so platforms drop their cached preview. */
export function shareFile(photo: SharePhoto | null, locale: Locale): string {
    const key = [photo?.src ?? 'wall', photo?.focus ?? 'center', brandName(locale)].join('\0');
    return `${createHash('sha1').update(key).digest('hex').slice(0, 12)}.jpg`;
}

export const shareImage = (photo: SharePhoto | null, locale: Locale): ShareImage => ({
    url: `/${SHARE_DIR}/${shareFile(photo, locale)}`,
    ...SHARE_SIZE,
    alt: photo?.alt ?? getSettings(locale).legalName
});

export const siteShareImage = (locale: Locale) => shareImage(sitePhoto(locale), locale);
