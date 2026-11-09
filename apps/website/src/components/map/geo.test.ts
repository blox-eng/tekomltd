import { describe, expect, it } from 'vitest';
import type { ProjectCard } from '@/content/cards';
import { inCity, mapPins, projectCity, projectCountry, scaleBarPx } from './geo';

const card: ProjectCard = {
    slug: 'old-town-house',
    title: 'Old town house',
    titleFallback: false,
    place: 'Stara Zagora',
    year: 2020,
    areaM2: 100,
    scopes: ['full'],
    residential: false,
    cover: { src: '/media/a.jpg', width: 10, height: 10, alt: '', focus: 'center' },
    pin: { lat: 42.4256, lng: 25.6241 }
};

describe('geo', () => {
    it('puts Stara Zagora centre inside the city box', () => expect(inCity({ lat: 42.4256, lng: 25.6241 })).toBe(true));
    it('puts Chernomorets outside the city box', () => expect(inCity({ lat: 42.4464, lng: 27.633 })).toBe(false));
    it('leaves out projects without coordinates', () => expect(mapPins([{ ...card, pin: null }]).country).toHaveLength(0));
    it('draws a 500 m scale bar to scale', () => expect(scaleBarPx(500)).toBeCloseTo(98.3, 0));

    it('projects the corners of Bulgaria onto the 640 x 400 canvas', () => {
        expect(projectCountry(22.2, 44.35)).toEqual([0, 0]);
        const [x, y] = projectCountry(28.8, 41.1);
        expect(x).toBeCloseTo(640);
        expect(y).toBeCloseTo(400);
    });

    it('projects the city box onto the 420 x 440 canvas', () => {
        expect(projectCity(25.612, 42.4335)).toEqual([0, 0]);
        const [x, y] = projectCity(25.638, 42.4135);
        expect(x).toBeCloseTo(420);
        expect(y).toBeCloseTo(440);
    });

    it('splits pins between the country map and the city map and counts the city ones', () => {
        const away = { ...card, slug: 'chernomorets', pin: { lat: 42.4464, lng: 27.633 } };
        const pins = mapPins([card, away]);
        expect(pins.cityCount).toBe(1);
        expect(pins.city.map((p) => p.slug)).toEqual(['old-town-house']);
        expect(pins.country.map((p) => p.slug)).toEqual(['chernomorets']);
    });

    it('nudges pins that land on the same spot so each one stays clickable', () => {
        const { city } = mapPins([card, { ...card, slug: 'twin' }]);
        expect(city[1]!.x - city[0]!.x).toBeGreaterThanOrEqual(12);
    });
});
