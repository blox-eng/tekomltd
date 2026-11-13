import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_LOCALE, type Locale } from '@tekom/i18n';
import { defaultRoot, parseFrontMatter, t } from './load';
import { projectFile } from './paths';
import { UpdateFront, updateFiles } from './progress';
import { listProjects } from './projects';

export type Announcement = {
    project: { slug: string; title: string };
    date: string;
    lead: string;
    /** The lead is Bulgarian on a page in another locale. */
    fallback: boolean;
    cta: { label: string; href: string } | null;
};

const LEAD_MAX = 160;

/** The first paragraph of an update as plain text, cut at a word before 160 characters. */
export function leadOf(markdown: string): string {
    const first = markdown.trim().split(/\n\s*\n/)[0] ?? '';
    const plain = first
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (plain.length <= LEAD_MAX) return plain;
    const cut = plain.slice(0, LEAD_MAX);
    return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–-]+$/, '')}…`;
}

/** The newest update with `home: true` of a published project, or null: then the home page shows no band. */
export function latestAnnouncement(locale: Locale, root: string = defaultRoot()): Announcement | null {
    const found = listProjects(locale, root)
        .flatMap((project) => {
            const file = projectFile(project.slug);
            const files = updateFiles(root, file);
            return files
                .filter((f) => f.locale === DEFAULT_LOCALE)
                .flatMap((bg) => {
                    const { data, body } = parseFrontMatter(readFileSync(join(root, bg.file), 'utf8'));
                    const front = UpdateFront.parse(data);
                    if (!front.home) return [];
                    const own = files.find((f) => f.date === bg.date && f.locale === locale);
                    const text = own ? parseFrontMatter(readFileSync(join(root, own.file), 'utf8')).body : body;
                    return [
                        {
                            project: { slug: project.slug, title: project.title },
                            date: bg.date,
                            lead: leadOf(text),
                            fallback: own === undefined,
                            cta: front.cta ? { label: t(front.cta.label, locale).text, href: front.cta.href } : null
                        }
                    ];
                });
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    return found[0] ?? null;
}
