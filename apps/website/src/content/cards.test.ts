import { describe, expect, it } from 'vitest';
import { toProjectCard } from './cards';
import type { Img } from './load';
import type { Project } from './schema';

const cover: Img = { src: '/media/projects/a/cover.jpg', width: 4, height: 3, alt: 'Cover' };
const project: Project = {
    slug: 'green-bath-eye-clinic',
    title: { bg: 'Очен център', en: 'Eye clinic' },
    place: { bg: 'Стара Загора', en: 'Stara Zagora' },
    year: 2025,
    built_area_m2: 872,
    lat: 42.4,
    lng: 25.6,
    show_on_map: true,
    scopes: ['restore'],
    wide: true,
    on_rail: true,
    old_slugs: [],
    draft: false,
    images: []
};

describe('toProjectCard', () => {
    it('picks the locale text and keeps the facts', () => {
        expect(toProjectCard(project, cover, 'en')).toEqual({
            slug: 'green-bath-eye-clinic',
            title: 'Eye clinic',
            titleFallback: false,
            place: 'Stara Zagora',
            year: 2025,
            areaM2: 872,
            scopes: ['restore'],
            cover,
            wide: true,
            pin: { lat: 42.4, lng: 25.6 }
        });
    });
    it('hides missing facts as null', () => {
        const c = toProjectCard({ ...project, year: undefined, built_area_m2: undefined, lat: undefined, lng: undefined }, cover, 'en');
        expect(c.year).toBeNull();
        expect(c.areaM2).toBeNull();
        expect(c.pin).toBeNull();
    });
    it('hides the pin unless the project is shown on the map', () => {
        expect(toProjectCard({ ...project, show_on_map: false }, cover, 'en').pin).toBeNull();
    });
    it('marks Bulgarian fallback', () => {
        expect(toProjectCard({ ...project, title: { bg: 'Очен център' } }, cover, 'en').titleFallback).toBe(true);
    });
    it('never marks fallback for bg', () => {
        expect(toProjectCard(project, cover, 'bg').titleFallback).toBe(false);
    });
});
