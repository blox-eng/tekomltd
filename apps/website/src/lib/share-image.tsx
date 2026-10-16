/** @jsxRuntime automatic */
// The build script runs this file outside Next, where the tsconfig asks for classic JSX.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import type { Locale } from '@tekom/i18n';
import { MARK_FACES } from '@tekom/ui/mark';
import { MEDIA_URL } from '../content/load';
import { brandName } from './seo';
import { SHARE_SIZE, type SharePhoto } from './share';

const GRAVITY = { center: 'centre', top: 'north', bottom: 'south', left: 'west', right: 'east' } as const;

/** Shown when a page has no photo at all: the `--wall` plaster. */
const WALL = '#E8E4DE';

const font = (subset: string) => readFile(join(__dirname, 'fonts', `sofia-sans-${subset}-500.woff`));

/** The T mark and wordmark, top left, over a faint scrim so they read on any photo. */
async function brandOverlay(locale: Locale): Promise<Buffer> {
    const [latin, cyrillic] = await Promise.all([font('latin'), font('cyrillic')]);
    const response = new ImageResponse(
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%',
                height: '100%',
                padding: 56,
                backgroundImage: 'linear-gradient(160deg, rgba(20,16,14,0.55) 0%, rgba(20,16,14,0) 45%)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#fff' }}>
                <svg width="52" height="52" viewBox="0 0 24 24">
                    {MARK_FACES.map(({ d, opacity }) => (
                        <path key={d} d={d} fill={`rgba(255,255,255,${opacity})`} />
                    ))}
                </svg>
                <span style={{ fontFamily: 'Sofia Sans', fontSize: 34, letterSpacing: 7.5 }}>{brandName(locale).toUpperCase()}</span>
            </div>
        </div>,
        {
            ...SHARE_SIZE,
            fonts: [
                { name: 'Sofia Sans', data: latin, weight: 500, style: 'normal' },
                { name: 'Sofia Sans', data: cyrillic, weight: 500, style: 'normal' }
            ]
        }
    );
    return Buffer.from(await response.arrayBuffer());
}

/** A 1200×630 JPEG of `photo` (a file under `contentRoot`), cropped at its focus, with the brand in the corner. */
export async function renderShareImage(photo: SharePhoto | null, locale: Locale, contentRoot: string): Promise<Buffer> {
    const base = photo
        ? sharp(join(contentRoot, photo.src.slice(MEDIA_URL.length + 1))).resize({ ...SHARE_SIZE, fit: 'cover', position: GRAVITY[photo.focus ?? 'center'] })
        : sharp({ create: { ...SHARE_SIZE, channels: 3, background: WALL } });
    return base
        .composite([{ input: await brandOverlay(locale) }])
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
}
