import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import sharp from 'sharp';

export const SITE = 'https://www.tekomltd.com';
export const API = `${SITE}/wp-json/wp/v2`;

const USER_AGENT = 'tekomltd-import';
const DELAY_MS = 300;
const ATTEMPTS = 3;
/** Downloaded files are cached between runs, so a re-run does not hit the site again. */
const CACHE = process.env.WP_CACHE ?? join(tmpdir(), 'tekomltd-wp-cache');

export const MAX_EDGE = 2400;
const JPEG_QUALITY = 82;

export type Rendered = { rendered: string };
export type WpPost = {
    id: number;
    slug: string;
    link: string;
    parent?: number;
    date: string;
    modified: string;
    title: Rendered;
    content: Rendered;
    featured_media?: number;
    yoast_head_json?: { og_image?: { url: string }[] };
};
export type WpMedia = {
    id: number;
    date: string;
    slug: string;
    post: number | null;
    mime_type: string;
    source_url: string;
    title: Rendered;
};

let lastRequest = 0;

/** One request at a time, a short pause between requests, a few retries on server errors. */
async function politeFetch(url: string): Promise<Response> {
    for (let attempt = 1; ; attempt++) {
        const wait = lastRequest + DELAY_MS - Date.now();
        if (wait > 0) await sleep(wait);
        lastRequest = Date.now();
        try {
            const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
            if (res.ok) return res;
            if (res.status < 500 || attempt === ATTEMPTS) throw new Error(`HTTP ${res.status} for ${url}`);
        } catch (e) {
            if (attempt === ATTEMPTS) throw e;
        }
        await sleep(1000 * attempt);
    }
}

/** Every item of a REST collection, following the pagination; `total` is what WordPress reports (X-WP-Total). */
export async function fetchCollection<T>(endpoint: string): Promise<{ items: T[]; total: number }> {
    const items: T[] = [];
    let total = 0;
    for (let page = 1, pages = 1; page <= pages; page++) {
        const res = await politeFetch(`${API}/${endpoint}?per_page=100&page=${page}`);
        pages = Number(res.headers.get('x-wp-totalpages') ?? 1);
        total = Number(res.headers.get('x-wp-total') ?? 0);
        items.push(...((await res.json()) as T[]));
    }
    return { items, total };
}

export type Download = { body: Buffer; filename: string | null };

/** A file from the site (or a government file link), from the cache when it was fetched before. */
export async function download(url: string): Promise<Download> {
    const key = createHash('sha1').update(url).digest('hex');
    const bodyPath = join(CACHE, key);
    const metaPath = `${bodyPath}.json`;
    if (existsSync(bodyPath) && existsSync(metaPath)) {
        return { body: readFileSync(bodyPath), filename: JSON.parse(readFileSync(metaPath, 'utf8')).filename };
    }
    const res = await politeFetch(url);
    const body = Buffer.from(await res.arrayBuffer());
    const disposition = res.headers.get('content-disposition') ?? '';
    const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    const plain = /filename="([^"]+)"/i.exec(disposition);
    const filename = star ? decodeURIComponent(star[1]!) : plain ? decodeURIComponent(plain[1]!) : null;
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(bodyPath, body);
    writeFileSync(metaPath, JSON.stringify({ url, filename }));
    return { body, filename };
}

export const sha256 = (body: Buffer) => createHash('sha256').update(body).digest('hex');

/**
 * Writes an image at `outBase` + extension and returns the full path. Photos are re-encoded as JPEG q82 at most
 * 2400 px on the long side, which also drops EXIF data such as GPS positions. With `keepPng`, a transparent PNG
 * (a logo) stays a PNG and keeps its bytes unless it has to shrink.
 */
export async function saveImage(input: Buffer, outBase: string, keepPng = false): Promise<string> {
    const image = sharp(input, { failOn: 'none' }).rotate();
    const meta = await image.metadata();
    const tooBig = Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_EDGE;
    const resized = tooBig ? image.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true }) : image;
    mkdirSync(dirname(outBase), { recursive: true });
    if (keepPng && meta.format === 'png' && meta.hasAlpha) {
        const out = `${outBase}.png`;
        writeFileSync(out, tooBig ? await resized.png({ compressionLevel: 9 }).toBuffer() : input);
        return out;
    }
    const out = `${outBase}.jpg`;
    writeFileSync(out, await resized.flatten({ background: '#ffffff' }).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer());
    return out;
}

/** Converts any image to PNG (for programme logos, which the schema keeps as PNG or SVG). */
export async function savePng(input: Buffer, outPath: string): Promise<string> {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, await sharp(input, { failOn: 'none' }).png({ compressionLevel: 9 }).toBuffer());
    return outPath;
}

/** The path of a site URL, decoded (`/wp-content/uploads/2025/10/Файл.pdf`). */
export const sitePath = (url: string) => decodeURI(new URL(url, SITE).pathname);
