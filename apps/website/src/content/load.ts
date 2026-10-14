import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pickL, type Locale } from '@tekom/i18n';
import { imageSize } from 'image-size';
import matter from 'gray-matter';
import YAML from 'yaml';
import { z } from 'zod';
import { contentRootFrom, resolveRef } from './paths';
import type { L } from './schema';

export const MEDIA_URL = '/media';

export type Img = { src: string; width: number; height: number; alt: string };

/** `<repo>/content`; the website build runs from `apps/website`. Override with CONTENT_ROOT. */
export const defaultRoot = () => process.env.CONTENT_ROOT ?? contentRootFrom(resolve(process.cwd(), '..', '..'));

const cache = new Map<string, unknown>();

/** Runs `compute` once per root and key, so a build reads each file once. */
export function once<T>(root: string, key: string, compute: () => T): T {
    const id = `${resolve(root)}\0${key}`;
    if (!cache.has(id)) cache.set(id, compute());
    return cache.get(id) as T;
}

export const clearContentCache = () => cache.clear();

export function readYaml<T extends z.ZodType>(root: string, file: string, schema: T): z.infer<T> {
    const path = join(root, file);
    if (!existsSync(path)) throw new Error(`content: ${file} is missing in ${root}`);
    const result = schema.safeParse(YAML.parse(readFileSync(path, 'utf8')));
    if (!result.success) {
        const issues = result.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ');
        throw new Error(`content: ${file} is invalid: ${issues}`);
    }
    return result.data;
}

export function parseFrontMatter(source: string) {
    const front = matter(source, { engines: { yaml: (s) => YAML.parse(s) ?? {} } });
    return { data: front.data as Record<string, unknown>, body: front.content.trim() };
}

/** Picks a locale text. `fallback` is true when the Bulgarian text stands in. */
export const t = (l: L, locale: Locale) => pickL(l, locale);

/** Picks a locale text and drops the fallback flag. */
export const text = (l: L, locale: Locale) => pickL(l, locale).text;

export const textOrNull = (l: L | undefined, locale: Locale) => (l ? text(l, locale) : null);

/** Public URL of a media file (image or PDF) referenced from `contentFile`. */
export const mediaUrl = (root: string, contentFile: string, ref: string) =>
    `${MEDIA_URL}/${relative(resolve(root), resolveRef(root, contentFile, ref))
        .split(sep)
        .join('/')}`;

/** Image for a file reference held by `contentFile`. Size is read from the file. */
export function loadImg(root: string, contentFile: string, ref: string, alt: string): Img {
    const path = resolveRef(root, contentFile, ref);
    const { width, height } = once(root, `size:${path}`, () => imageSize(readFileSync(path)));
    return { src: mediaUrl(root, contentFile, ref), width, height, alt };
}

export const imgOrNull = (root: string, contentFile: string, ref: string | undefined, alt: string) =>
    ref === undefined ? null : loadImg(root, contentFile, ref, alt);
