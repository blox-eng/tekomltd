import type { ProjectCard } from '@/content/cards';

export const COUNTRY_VIEW = { width: 640, height: 400, lon: [22.2, 28.8], lat: [41.1, 44.35] } as const;
export const CITY_VIEW = { width: 420, height: 440 } as const;
/** About 2.1 x 2.2 km around the centre of Stara Zagora. */
export const CITY_BOX = { lon: [25.612, 25.638], lat: [42.4135, 42.4335] } as const;
export const CITY_CENTRE = { lng: 25.625, lat: 42.425 } as const;

const METRES_PER_DEGREE = 111_320;
const CITY_LATITUDE = 42.42;
const PIN_NUDGE = 12;

type Point = { lat: number; lng: number };
export type Pin = { slug: string; title: string; tip: string; x: number; y: number };

export function projectCountry(lng: number, lat: number): [number, number] {
    const { width, height, lon, lat: latRange } = COUNTRY_VIEW;
    return [((lng - lon[0]) / (lon[1] - lon[0])) * width, ((latRange[1] - lat) / (latRange[1] - latRange[0])) * height];
}

const cityScale = {
    x: CITY_VIEW.width / (CITY_BOX.lon[1] - CITY_BOX.lon[0]),
    y: CITY_VIEW.height / (CITY_BOX.lat[1] - CITY_BOX.lat[0])
};

export function projectCity(lng: number, lat: number): [number, number] {
    return [(lng - CITY_BOX.lon[0]) * cityScale.x, (CITY_BOX.lat[1] - lat) * cityScale.y];
}

export const inCity = ({ lat, lng }: Point) => lng >= CITY_BOX.lon[0] && lng <= CITY_BOX.lon[1] && lat >= CITY_BOX.lat[0] && lat <= CITY_BOX.lat[1];

export function scaleBarPx(metres = 500): number {
    return (metres / (METRES_PER_DEGREE * Math.cos((CITY_LATITUDE * Math.PI) / 180))) * cityScale.x;
}

/** Pins that land on the same spot are moved sideways so every one can be reached. */
function nudgeOverlaps(pins: Pin[]): Pin[] {
    const seen = new Map<string, number>();
    return pins.map((pin) => {
        const key = `${Math.round(pin.x / 6)},${Math.round(pin.y / 6)}`;
        const count = seen.get(key) ?? 0;
        seen.set(key, count + 1);
        return count ? { ...pin, x: pin.x + PIN_NUDGE * count } : pin;
    });
}

export function mapPins(cards: ProjectCard[]): { country: Pin[]; city: Pin[]; cityCount: number } {
    const located = cards.flatMap((card) => (card.pin ? [{ card, pin: card.pin }] : []));
    const toPin = (card: ProjectCard, [x, y]: [number, number]): Pin => ({
        slug: card.slug,
        title: card.title,
        tip: [card.place, card.title].filter(Boolean).join(' · '),
        x,
        y
    });
    const city = nudgeOverlaps(located.filter(({ pin }) => inCity(pin)).map(({ card, pin }) => toPin(card, projectCity(pin.lng, pin.lat))));
    const country = located.filter(({ pin }) => !inCity(pin)).map(({ card, pin }) => toPin(card, projectCountry(pin.lng, pin.lat)));
    return { country, city, cityCount: city.length };
}
