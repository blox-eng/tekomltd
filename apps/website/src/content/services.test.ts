import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkContent } from './check';
import { serviceYaml } from './__fixtures__/service-yaml';
import { allServiceSlugs, getService, listServices, servicesOfProject } from './services';

// The loader fixture, with old-town-house as a home: green-bath-eye-clinic is `full` but not residential, the draft is `restore`.
const root = mkdtempSync(join(tmpdir(), 'tekom-services-'));
cpSync(join(__dirname, '__fixtures__', 'loader'), root, { recursive: true });
const append = (file: string, text: string) => writeFileSync(join(root, file), readFileSync(join(root, file), 'utf8') + text);
append('projects/old-town-house/project.yaml', 'scopes: [full]\nresidential: true\n');
append('projects/hidden-draft/project.yaml', 'scopes: [restore]\n');
mkdirSync(join(root, 'services'));
writeFileSync(join(root, 'services', 'homes.yaml'), serviceYaml('homes', '{ scope: full, residential: true }'));
writeFileSync(
    join(root, 'services', 'building.yaml'),
    serviceYaml('building', '{ scope: full }', 'cover_project: green-bath-eye-clinic\nold_paths: [/services]')
);
writeFileSync(join(root, 'services', 'restore.yaml'), serviceYaml('restore', '{ scope: restore }'));

afterAll(() => rmSync(root, { recursive: true, force: true }));

it('uses a tree that passes the content check', () => expect(checkContent(root)).toEqual({ ok: true }));

describe('getService', () => {
    it('lists the projects of its scope in display order, and only homes when it asks for them', () => {
        expect(getService('building', 'bg', root)!.projects.map((p) => p.slug)).toEqual(['old-town-house', 'green-bath-eye-clinic']);
        expect(getService('homes', 'bg', root)!.projects.map((p) => p.slug)).toEqual(['old-town-house']);
    });
    it('never lists a draft', () => {
        expect(getService('restore', 'bg', root)!.projects.map((p) => p.slug)).toEqual(['green-bath-eye-clinic']);
    });
    it('leads with cover_project, else the first project', () => {
        expect(getService('building', 'bg', root)!.cover.slug).toBe('green-bath-eye-clinic');
        expect(getService('homes', 'bg', root)!.cover.slug).toBe('old-town-house');
    });
    it('has no page in a locale it is not written in', () => {
        expect(getService('homes', 'en', root)).toBeNull();
        expect(listServices('en', root)).toEqual([]);
        expect(allServiceSlugs(root).find((s) => s.slug === 'building')).toEqual({ slug: 'building', locales: ['bg'], oldPaths: ['/services'] });
    });
});

describe('servicesOfProject', () => {
    it('names every service whose page lists the project', () => {
        expect(servicesOfProject({ scopes: ['full'], residential: true }, 'bg', root).map((s) => s.slug)).toEqual(['building', 'homes']);
        expect(servicesOfProject({ scopes: ['restore', 'full'], residential: false }, 'bg', root).map((s) => s.slug)).toEqual(['building', 'restore']);
        expect(servicesOfProject({ scopes: ['interior'], residential: false }, 'bg', root)).toEqual([]);
    });
});
