import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkContent, main, type ContentError } from './check';
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
    it('rejects a cover project that has no photo yet', () => {
        const root = tree((r) => {
            mkdirSync(join(r, 'services'));
            mkdirSync(join(r, 'projects/new-site'));
            write(
                r,
                'projects/new-site/project.yaml',
                'slug: new-site\ntitle: { bg: Нов обект }\nplace: { bg: Стара Загора }\nscopes: [restore]\nprogress:\n  status: in_progress\n  kind: building\n'
            );
            write(r, 'services/restore.yaml', serviceYaml('restore', '{ scope: restore }', 'cover_project: new-site'));
        });
        expect(messages(root)).toEqual(['services/restore.yaml: cover_project "new-site" has no photo yet; choose a project with a photo']);
    });
    it('rejects a search title that the template would push past the limit', () => {
        const long = serviceYaml('restore', '{ scope: restore }').replace('meta_title: { bg: Заглавие }', `meta_title: { bg: ${'я'.repeat(53)} }`);
        expect(messages(withService('restore.yaml', long))).toEqual(['services/restore.yaml: meta_title.bg Too big: expected string to have <=52 characters']);
    });
});

describe('checkContent: projects in progress', () => {
    const SITE = 'projects/work-site/project.yaml';
    const TODAY = '2026-11-12';
    const base = (progress: string, extra = '') =>
        `slug: work-site\ntitle: { bg: Обект }\nplace: { bg: Стара Загора }\n${extra}images:\n  - file: site.jpg\nprogress:\n${progress}`;
    const stages = (...lines: string[]) => `  status: in_progress\n  kind: facade\n  stages:\n${lines.join('\n')}\n`;

    /** The valid tree plus `projects/work-site` with `yaml` and the update files in `updates`. */
    function site(yaml: string, updates: Record<string, string> = {}) {
        return tree((r) => {
            mkdirSync(join(r, 'projects/work-site/updates'), { recursive: true });
            cpSync(join(r, 'projects/green-bath-eye-clinic/cover.jpg'), join(r, 'projects/work-site/site.jpg'));
            cpSync(join(r, 'projects/green-bath-eye-clinic/cover.jpg'), join(r, 'projects/work-site/updates/p.jpg'));
            write(r, SITE, yaml);
            for (const [name, body] of Object.entries(updates)) write(r, `projects/work-site/updates/${name}`, body);
        });
    }
    const check = (root: string) => checkContent(root, { today: TODAY });
    const errs = (root: string) => {
        const result = check(root);
        return result.ok ? [] : result.errors;
    };

    it('accepts a project in progress with a fresh update', () =>
        expect(
            check(site(base(stages('    - key: scaffold\n      started: 2026-10-01')), { '2026-11-01.bg.md': '---\nphotos:\n  - file: p.jpg\n---\nТекст' }))
        ).toEqual({
            ok: true,
            warnings: []
        }));
    it('accepts a done date of today', () => expect(errs(site(base(stages('    - key: scaffold\n      done: 2026-11-12'))))).toEqual([]));
    it('rejects a done date of tomorrow', () =>
        expect(errs(site(base(stages('    - key: scaffold\n      done: 2026-11-13'))))).toEqual([
            { file: SITE, path: 'progress.stages.0.done', message: 'date 2026-11-13 is in the future; write the day it happened' }
        ]));
    it('rejects a start date in the future', () =>
        expect(errs(site(base(stages('    - key: scaffold\n      started: 2027-01-01'))))).toEqual([
            { file: SITE, path: 'progress.stages.0.started', message: 'date 2027-01-01 is in the future; write the day it happened' }
        ]));
    it('rejects done before started', () =>
        expect(errs(site(base(stages('    - key: scaffold\n      started: 2026-10-02\n      done: 2026-10-01'))))).toEqual([
            { file: SITE, path: 'progress.stages.0.done', message: 'done 2026-10-01 is before started 2026-10-02' }
        ]));
    it('rejects a year while the work goes on', () =>
        expect(errs(site(base(stages('    - key: scaffold'), 'year: 2026\n')))).toEqual([
            { file: SITE, path: 'year', message: 'remove year until progress.status is done' }
        ]));
    it('needs a year when the project is done', () =>
        expect(errs(site(base('  status: done\n  kind: facade\n  stages:\n    - key: scaffold\n      done: 2026-10-01\n')))).toEqual([
            { file: SITE, path: 'year', message: 'a finished project needs year' }
        ]));
    it('needs a done date on every stage when the project is done', () =>
        expect(errs(site(base('  status: done\n  kind: facade\n  stages:\n    - key: scaffold\n      started: 2026-10-01\n', 'year: 2026\n')))).toEqual([
            { file: SITE, path: 'progress.stages.0.done', message: 'a finished project needs a done date on every stage' }
        ]));
    it('needs the stages listed with done dates when the project is done', () =>
        expect(errs(site(base('  status: done\n  kind: facade\n', 'year: 2026\n')))).toEqual([
            { file: SITE, path: 'progress.stages', message: 'a finished project lists its stages, each with a done date' }
        ]));

    const ok = base(stages('    - key: scaffold'));
    it.each(['2026-11-01.md', '01-11-2026.bg.md', 'notes.txt'])('rejects the update name %s', (name) =>
        expect(errs(site(ok, { [name]: 'x' }))).toEqual([
            { file: `projects/work-site/updates/${name}`, path: '(file)', message: 'name must be YYYY-MM-DD.bg.md, for example 2026-11-20.bg.md' }
        ])
    );
    it('rejects an update date that is not on the calendar', () =>
        expect(errs(site(ok, { '2026-02-30.bg.md': 'x' }))).toEqual([
            { file: 'projects/work-site/updates/2026-02-30.bg.md', path: '(file)', message: '2026-02-30 is not a real past or present date' }
        ]));
    it('rejects an update date in the future', () =>
        expect(errs(site(ok, { '2026-11-13.bg.md': 'x' }))).toEqual([
            { file: 'projects/work-site/updates/2026-11-13.bg.md', path: '(file)', message: '2026-11-13 is not a real past or present date' }
        ]));
    it('needs the Bulgarian update before a translation', () =>
        expect(errs(site(ok, { '2026-11-01.en.md': 'x' }))).toEqual([
            { file: 'projects/work-site/updates/2026-11-01.en.md', path: '(file)', message: 'add 2026-11-01.bg.md first; the Bulgarian text is required' }
        ]));
    it('keeps photos in the Bulgarian update', () =>
        expect(errs(site(ok, { '2026-11-01.bg.md': 'x', '2026-11-01.en.md': '---\nphotos:\n  - file: p.jpg\n---\nx' }))).toEqual([
            { file: 'projects/work-site/updates/2026-11-01.en.md', path: 'photos', message: 'photos go in the .bg.md file' }
        ]));
    it('finds a missing update photo', () =>
        expect(errs(site(ok, { '2026-11-01.bg.md': '---\nphotos:\n  - file: gone.jpg\n---\nx' }))).toEqual([
            { file: 'projects/work-site/updates/2026-11-01.bg.md', path: 'photos.0.file', message: 'file not found: gone.jpg' }
        ]));
    it('asks for a JPEG when a phone photo is HEIC', () =>
        expect(errs(site(ok, { 'IMG_0001.HEIC': 'x' }))).toEqual([
            { file: 'projects/work-site/updates/IMG_0001.HEIC', path: '(file)', message: 'save the photo as .jpg; the site cannot show .heic' }
        ]));
    it('checks the extension of an update photo', () =>
        expect(errs(site(ok, { '2026-11-01.bg.md': '---\nphotos:\n  - file: p.gif\n---\nx' }))).toEqual([
            { file: 'projects/work-site/updates/2026-11-01.bg.md', path: 'photos.0.file', message: expect.stringMatching(/^must end in \.jpg/) }
        ]));
    it('lets a project in progress go without photos', () =>
        expect(errs(site(base(stages('    - key: scaffold')).replace('images:\n  - file: site.jpg\n', '')))).toEqual([]));
    it('still needs a photo once the project is done', () =>
        expect(
            errs(
                site(
                    base('  status: done\n  kind: facade\n  stages:\n    - key: scaffold\n      done: 2026-10-01\n', 'year: 2026\n').replace(
                        'images:\n  - file: site.jpg\n',
                        ''
                    )
                )
            ).map((e) => e.path)
        ).toEqual(['images']));
    it('needs a progress block for updates', () =>
        expect(
            errs(site('slug: work-site\ntitle: { bg: Обект }\nplace: { bg: Стара Загора }\nimages:\n  - file: site.jpg\n', { '2026-11-01.bg.md': 'x' }))
        ).toEqual([{ file: 'projects/work-site/updates/2026-11-01.bg.md', path: '(file)', message: 'updates need a progress block in project.yaml' }]));

    it('does not warn when the newest update is 45 days old', () => expect(check(site(ok, { '2026-09-28.bg.md': 'x' }))).toEqual({ ok: true, warnings: [] }));
    it('warns when the newest update is 46 days old', () =>
        expect(check(site(ok, { '2026-09-27.bg.md': 'x' }))).toEqual({
            ok: true,
            warnings: [{ file: SITE, path: 'progress', message: 'newest update is 46 days old; add one in updates/' }]
        }));
    it('does not warn for a draft', () => expect(check(site(`draft: true\n${ok}`, { '2026-01-01.bg.md': 'x' }))).toEqual({ ok: true, warnings: [] }));
    it('still checks a draft', () =>
        expect(errs(site(`draft: true\n${base(stages('    - key: scaffold\n      done: 2027-01-01'))}`)).map((e) => e.path)).toEqual([
            'progress.stages.0.done'
        ]));
    it('prints warnings and still passes', () => {
        const root = site(ok, { '2020-01-01.bg.md': 'x' });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        expect(main(['node', 'check.ts', root])).toBe(0);
        expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^warning: projects\/work-site\/project\.yaml: progress newest update is \d+ days old/));
        warn.mockRestore();
        log.mockRestore();
    });
});

describe('checkContent: buildings for sale', () => {
    const SALES = join(__dirname, '__fixtures__', 'sales', 'projects', 'sale-block');
    const DIR = 'projects/sale-block';
    const FILE = `${DIR}/project.yaml`;
    const TODAY = '2026-11-12';
    const sale = (change: (root: string) => void = () => {}) =>
        tree((r) => {
            cpSync(SALES, join(r, DIR), { recursive: true });
            change(r);
        });
    const check = (root: string, today = TODAY) => checkContent(root, { today });
    const errs = (root: string) => {
        const result = check(root);
        return result.ok ? [] : result.errors;
    };

    it('accepts the example building', () => expect(check(sale())).toEqual({ ok: true, warnings: [] }));

    it('refuses a price in a unit', () =>
        expect(errs(sale((r) => edit(r, `${DIR}/units/12.yaml`, (t) => `${t}price: 120000\n`)))).toContainEqual(
            expect.objectContaining({ file: `${DIR}/units/12.yaml`, message: expect.stringContaining('price') })
        ));

    it('refuses a DXF or DWG file anywhere in content', () => {
        const message = 'remove the DXF/DWG file from content/; commit only the plan that pnpm blueprint writes';
        expect(errs(sale((r) => write(r, `${DIR}/plans/1.dxf`, '0\nEOF\n')))).toContainEqual({ file: `${DIR}/plans/1.dxf`, path: '(file)', message });
        expect(errs(sale((r) => write(r, 'Floor.DWG', 'x')))).toContainEqual({ file: 'Floor.DWG', path: '(file)', message });
    });

    it('refuses a unit on a floor the building does not list', () =>
        expect(errs(sale((r) => edit(r, `${DIR}/units/22.yaml`, (t) => t.replace("floors: ['2']", "floors: ['3']"))))).toContainEqual({
            file: `${DIR}/units/22.yaml`,
            path: 'floors.0',
            message: 'floor 3 is not in sales.floors of project.yaml'
        }));

    it('refuses a floor without a plan', () =>
        expect(errs(sale((r) => rmSync(join(r, DIR, 'plans/0.svg'))))).toContainEqual({
            file: FILE,
            path: 'sales.floors.0',
            message: 'plans/0.svg is missing; make it with pnpm blueprint'
        }));

    it('refuses a plan that is not in the blueprint format', () =>
        expect(errs(sale((r) => write(r, `${DIR}/plans/0.svg`, '<svg/>')))).toContainEqual({
            file: `${DIR}/plans/0.svg`,
            path: '(file)',
            message: 'плана няма viewBox; направи го отново с pnpm blueprint'
        }));

    it('refuses an outline without a unit file and a unit without an outline', () => {
        const root = sale((r) => edit(r, `${DIR}/plans/1.svg`, (t) => t.replace('data-unit="13"', 'data-unit="99"')));
        expect(errs(root)).toContainEqual({ file: `${DIR}/plans/1.svg`, path: '(file)', message: 'outline 99 has no units/99.yaml' });
        expect(errs(root)).toContainEqual({ file: `${DIR}/units/13.yaml`, path: 'floors', message: 'unit 13 has no outline on plans/1.svg' });
    });

    it('refuses areas out of order', () =>
        expect(errs(sale((r) => edit(r, `${DIR}/units/12.yaml`, (t) => t.replace('net: 72', 'net: 90'))))).toContainEqual(
            expect.objectContaining({ file: `${DIR}/units/12.yaml`, path: 'area' })
        ));

    it('refuses rooms on a garage', () =>
        expect(errs(sale((r) => edit(r, `${DIR}/units/G1.yaml`, (t) => `${t}rooms: 1\n`)))).toContainEqual(
            expect.objectContaining({ file: `${DIR}/units/G1.yaml`, path: 'rooms' })
        ));

    it('refuses two codes that share one address', () =>
        expect(
            errs(sale((r) => write(r, `${DIR}/units/a3.yaml`, readFileSync(join(r, DIR, 'units/A3.yaml'), 'utf8').replace('code: A3', 'code: a3'))))
        ).toContainEqual({
            file: `${DIR}/units/a3.yaml`,
            path: 'code',
            message: 'units A3 and a3 share the address …/a3; rename one'
        }));

    it('refuses a unit file named after another code', () =>
        expect(errs(sale((r) => edit(r, `${DIR}/units/22.yaml`, (t) => t.replace("code: '22'", "code: '23'"))))).toContainEqual({
            file: `${DIR}/units/22.yaml`,
            path: 'code',
            message: 'name the file 23.yaml, after its code'
        }));

    it('refuses a sales block without units', () =>
        expect(errs(sale((r) => rmSync(join(r, DIR, 'units'), { recursive: true })))).toContainEqual({
            file: FILE,
            path: 'sales',
            message: `sales needs at least one unit in ${DIR}/units/`
        }));

    it('refuses units without a sales block', () =>
        expect(errs(sale((r) => edit(r, FILE, (t) => t.slice(0, t.indexOf('sales:')))))).toContainEqual({
            file: FILE,
            path: 'sales',
            message: 'units/ needs a sales block in project.yaml'
        }));

    it('warns when the availability is older than 45 days', () => {
        expect(check(sale(), '2026-12-16').warnings.filter((w) => w.path === 'sales.updated')).toEqual([]);
        const later = check(sale(), '2026-12-17');
        expect(later.ok).toBe(true);
        expect(later.warnings).toContainEqual({
            file: FILE,
            path: 'sales.updated',
            message: 'availability is 46 days old; check every status, then set sales.updated to today'
        });
    });
});

describe('checkContent: updates on the home page', () => {
    const SALES = join(__dirname, '__fixtures__', 'sales', 'projects');
    const UPDATE = 'projects/sale-block/updates/2026-11-01.bg.md';
    const site = (change: (root: string) => void = () => {}) =>
        tree((r) => {
            cpSync(join(SALES, 'sale-block'), join(r, 'projects/sale-block'), { recursive: true });
            change(r);
        });
    const errs = (root: string) => {
        const result = checkContent(root, { today: '2026-11-12' });
        return result.ok ? [] : result.errors;
    };

    it('accepts a home update with a button', () => expect(errs(site())).toEqual([]));

    it('refuses a button that leaves the site', () =>
        expect(errs(site((r) => edit(r, UPDATE, (t) => t.replace('/projects/sale-block#apartamenti', 'https://example.com'))))).toContainEqual({
            file: UPDATE,
            path: 'cta.href',
            message: 'the button goes to a page of this site (/…) or to mailto:'
        }));

    it('refuses home on an update of a draft project', () =>
        expect(errs(site((r) => edit(r, 'projects/sale-block/project.yaml', (t) => `${t}draft: true\n`)))).toContainEqual({
            file: UPDATE,
            path: 'home',
            message: 'the project is a draft; publish it or remove home'
        }));

    it('refuses home and cta in a translation', () =>
        expect(errs(site((r) => write(r, 'projects/sale-block/updates/2026-11-01.en.md', '---\nhome: true\n---\nText\n')))).toContainEqual({
            file: 'projects/sale-block/updates/2026-11-01.en.md',
            path: 'home',
            message: 'home and cta go in the .bg.md file'
        }));
});
