import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkContent, type ContentError } from './check';
import { serviceYaml } from './__fixtures__/service-yaml';

const VALID = join(__dirname, '__fixtures__', 'valid');
const PROJECT = 'projects/green-bath-eye-clinic/project.yaml';
const dirs: string[] = [];

/** A copy of the valid fixture, changed by `edit`. */
function tree(edit: (root: string) => void): string {
    const root = mkdtempSync(join(tmpdir(), 'tekom-check-'));
    dirs.push(root);
    cpSync(VALID, root, { recursive: true });
    edit(root);
    return root;
}

const write = (root: string, file: string, text: string) => writeFileSync(join(root, file), text);
const edit = (root: string, file: string, change: (text: string) => string) => write(root, file, change(readFileSync(join(root, file), 'utf8')));

function errorsOf(root: string, options?: Parameters<typeof checkContent>[1]): ContentError[] {
    const result = checkContent(root, options);
    return result.ok ? [] : result.errors;
}

/** A second published project that copies the first one's WordPress identity. */
function addTwin(root: string) {
    cpSync(join(root, 'projects', 'green-bath-eye-clinic'), join(root, 'projects', 'twin-site'), { recursive: true });
    edit(root, 'projects/twin-site/project.yaml', (text) =>
        text.replace('slug: green-bath-eye-clinic', 'slug: twin-site').replace('old_slugs: [eye-clinic]', '')
    );
}

afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('checkContent: projects', () => {
    it('explains a copied wp_id in plain words', () => {
        const errors = errorsOf(tree(addTwin));
        expect(errors).toContainEqual({
            file: 'projects/twin-site/project.yaml',
            path: 'wp_id',
            message: 'wp_id 1952 is already used by projects/green-bath-eye-clinic — delete this line in a new project'
        });
    });

    it('rejects a copied wp_slug', () => {
        const errors = errorsOf(tree(addTwin));
        expect(errors).toContainEqual({
            file: 'projects/twin-site/project.yaml',
            path: 'wp_slug',
            message: 'wp_slug "green-bath-eye-clinic" is already used by projects/green-bath-eye-clinic — delete this line in a new project'
        });
    });

    it('rejects coordinates outside Bulgaria, for example lat and lng swapped', () => {
        const root = tree((r) => edit(r, PROJECT, (text) => text.replace('lat: 42.4255841', 'lat: 25.6240982').replace('lng: 25.6240982', 'lng: 42.4255841')));
        expect(errorsOf(root)).toEqual([{ file: PROJECT, path: 'lat', message: expect.stringMatching(/Bulgaria.*lat 41–44\.5.*lng 22–29/) }]);
    });
});

describe('checkContent: image focus', () => {
    it('names the image and the allowed words when a focus is wrong', () => {
        const root = tree((r) => edit(r, PROJECT, (text) => text.replace('    is_cover: true', '    is_cover: true\n    focus: middle')));
        expect(errorsOf(root)).toEqual([{ file: PROJECT, path: 'images.0.focus', message: expect.stringMatching(/center.*top.*bottom.*left.*right/) }]);
    });

    it('accepts a valid focus', () => {
        const root = tree((r) => edit(r, PROJECT, (text) => text.replace('    is_cover: true', '    is_cover: true\n    focus: top')));
        expect(errorsOf(root)).toEqual([]);
    });
});

describe('checkContent: required files', () => {
    it('requires eu-programmes.yaml and publications.yaml, which the site reads', () => {
        const root = tree((r) => {
            rmSync(join(r, 'eu-programmes.yaml'));
            rmSync(join(r, 'publications.yaml'));
        });
        expect(errorsOf(root).map((e) => `${e.file}: ${e.message}`)).toEqual(
            expect.arrayContaining(['eu-programmes.yaml: required file is missing', 'publications.yaml: required file is missing'])
        );
    });
});

describe('checkContent: Markdown pages', () => {
    it('rejects an image that is not a content file under /media/', () => {
        const root = tree((r) => {
            edit(r, 'pages/about.bg.md', (text) => `${text}\n\n![Logo](https://example.com/logo.png)\n\n![Local](about/iso.png)\n`);
            edit(r, 'legal/privacy.bg.md', (text) => `${text}\n\n![Tracker][pixel]\n\n[pixel]: https://example.com/p.gif\n`);
        });
        expect(errorsOf(root)).toEqual([
            {
                file: 'legal/privacy.bg.md',
                path: 'body',
                message: expect.stringMatching(/^image must be a file under \/media\/: https:\/\/example\.com\/p\.gif/)
            },
            {
                file: 'pages/about.bg.md',
                path: 'body',
                message: expect.stringMatching(/^image must be a file under \/media\/: https:\/\/example\.com\/logo\.png/)
            },
            { file: 'pages/about.bg.md', path: 'body', message: expect.stringMatching(/^image must be a file under \/media\/: about\/iso\.png/) }
        ]);
    });

    it('allows a plain link to another site', () => {
        const root = tree((r) => edit(r, 'pages/about.bg.md', (text) => `${text}\n\n[Агенция по заетостта](https://www.az.government.bg/)\n`));
        expect(errorsOf(root)).toEqual([]);
    });

    it('reports a broken percent sign in a media link instead of crashing', () => {
        const root = tree((r) => edit(r, 'pages/about.bg.md', (text) => `${text}\n\n[Файл](/media/publications/100%.pdf)\n`));
        expect(errorsOf(root)).toEqual([{ file: 'pages/about.bg.md', path: 'body', message: expect.stringMatching(/\/media\/publications\/100%\.pdf/) }]);
    });

    it('rejects a page name that is taken by a site address or a language', () => {
        const root = tree((r) => {
            for (const slug of ['contact', 'projects', 'eu-programmes', 'publications', 'privacy', 'en', 'de', 'media'])
                write(r, `pages/${slug}.bg.md`, '---\ntitle: Т\nupdated: 2026-10-14\n---\n\nТекст.\n');
        });
        const taken = errorsOf(root).filter((e) => /already an address of the site/.test(e.message));
        expect(taken.map((e) => e.file).sort()).toEqual(
            ['contact', 'de', 'en', 'eu-programmes', 'media', 'privacy', 'projects', 'publications'].map((s) => `pages/${s}.bg.md`)
        );
    });
});

describe('checkContent: old WordPress file addresses', () => {
    const urlMapWith = (root: string, files: Record<string, string>) => {
        const file = join(root, 'url-map.json');
        writeFileSync(file, JSON.stringify({ files, pages: {} }));
        return file;
    };

    it('passes when every redirect target is still a content file', () => {
        const root = tree(() => undefined);
        const urlMap = urlMapWith(root, { '/wp-content/uploads/2015/06/a.jpg': '/media/projects/green-bath-eye-clinic/cover.jpg' });
        expect(errorsOf(root, { urlMap })).toEqual([]);
    });

    it('fails with a plain message when a redirected file was renamed or deleted', () => {
        const root = tree(() => undefined);
        const urlMap = urlMapWith(root, { '/wp-content/uploads/2015/06/a.jpg': '/media/projects/green-bath-eye-clinic/renamed.jpg' });
        expect(errorsOf(root, { urlMap })).toEqual([
            {
                file: 'projects/green-bath-eye-clinic/renamed.jpg',
                path: '(file)',
                message: expect.stringMatching(/^file not found: the old address \/wp-content\/uploads\/2015\/06\/a\.jpg leads here/)
            }
        ]);
    });
});

describe('services', () => {
    const withService = (name: string, text: string) =>
        tree((root) => {
            mkdirSync(join(root, 'services'));
            write(root, `services/${name}`, text);
        });
    const messages = (root: string) => errorsOf(root).map((e) => `${e.file}: ${e.path} ${e.message}`);

    it('accepts a service whose scope has a published project', () => {
        expect(errorsOf(withService('restore.yaml', serviceYaml('restore', '{ scope: restore }')))).toEqual([]);
    });
    it('rejects a service that would list no project', () => {
        expect(messages(withService('facade.yaml', serviceYaml('facade', '{ scope: facade }')))).toEqual([
            'services/facade.yaml: projects no published project has scope "facade"'
        ]);
    });
    it('rejects a slug that differs from the file name or takes an address of the site', () => {
        expect(messages(withService('x.yaml', serviceYaml('y', '{ scope: restore }')))).toEqual([
            'services/x.yaml: slug slug "y" must match the file name "x.yaml"'
        ]);
        expect(messages(withService('contact.yaml', serviceYaml('contact', '{ scope: restore }')))).toContainEqual(
            'services/contact.yaml: slug "contact" is already an address of the site; give the service another slug'
        );
    });
    it('rejects a cover project the page does not show, and an old path that is still a live page', () => {
        const root = withService('restore.yaml', serviceYaml('restore', '{ scope: restore }', 'cover_project: other-site\nold_paths: [/about]'));
        expect(messages(root)).toEqual([
            'services/restore.yaml: cover_project "other-site" is not one of the projects this page shows',
            'services/restore.yaml: old_paths.0 "/about" is a live page of the site; delete that page first'
        ]);
    });
    it('rejects a search title that the template would push past the limit', () => {
        const long = serviceYaml('restore', '{ scope: restore }').replace('meta_title: { bg: Заглавие }', `meta_title: { bg: ${'я'.repeat(53)} }`);
        expect(messages(withService('restore.yaml', long))).toEqual(['services/restore.yaml: meta_title.bg Too big: expected string to have <=52 characters']);
    });
});
