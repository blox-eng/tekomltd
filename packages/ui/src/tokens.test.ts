import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles/tokens.css', import.meta.url), 'utf8').replaceAll("'", '"');

function block(selector: string): Record<string, string> {
    const start = css.indexOf(`${selector} {`);
    if (start < 0) throw new Error(`no ${selector} block`);
    const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
    return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]));
}

const light = block(':root');
const dark = block(':root[data-theme="dark"]');

function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi! + 0.05) / (lo! + 0.05);
}

describe('tokens.css', () => {
    it('accent passes AA on bg in both themes', () => {
        expect(contrast(light['--accent']!, light['--bg']!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(dark['--accent']!, dark['--bg']!)).toBeGreaterThanOrEqual(4.5);
    });

    it('muted passes AA on bg in both themes', () => {
        expect(contrast(light['--muted']!, light['--bg']!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(dark['--muted']!, dark['--bg']!)).toBeGreaterThanOrEqual(4.5);
    });

    it('text on accent passes AA in both themes', () => {
        expect(contrast(light['--on-accent']!, light['--accent']!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(dark['--on-accent']!, dark['--accent']!)).toBeGreaterThanOrEqual(4.5);
    });

    it('defines the same colour tokens in both themes', () => {
        for (const name of [
            '--bg',
            '--field',
            '--wall',
            '--text',
            '--muted',
            '--faint',
            '--line',
            '--line-2',
            '--accent',
            '--on-accent',
            '--panel',
            '--on-panel',
            '--neg'
        ]) {
            expect(light[name], name).toBeDefined();
            expect(dark[name], name).toBeDefined();
        }
    });

    it('mirrors the dark theme under the media query', () => {
        const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
        expect(media).toContain(':root:not([data-theme="light"])');
        for (const [name, value] of Object.entries(dark).filter(([n]) => n !== 'color-scheme')) {
            expect(media, name).toContain(`${name}: ${value};`);
        }
    });

    it('uses one motion curve and the DESIGN.md durations', () => {
        expect(light['--ease']).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
        expect([light['--dur-micro'], light['--dur-standard'], light['--dur-reveal']]).toEqual(['180ms', '240ms', '600ms']);
    });
});
