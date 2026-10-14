import { describe, expect, it } from 'vitest';
import { FOCUS } from '../../content/schema';
import { OBJECT_POSITION, squareSources } from './square';

const photo = { src: '/media/projects/river-house/garden.jpg', width: 2400, height: 1600, alt: 'Garden', focus: 'center' as const };

describe('OBJECT_POSITION', () => {
    it('maps every focus to a CSS object-position', () => {
        expect(OBJECT_POSITION).toEqual({ center: '50% 50%', top: '50% 0%', bottom: '50% 100%', left: '0% 50%', right: '100% 50%' });
        expect(Object.keys(OBJECT_POSITION).sort()).toEqual([...FOCUS].sort());
    });
});

describe('squareSources', () => {
    it('serves the original file when there is no image CDN', () => {
        expect(squareSources(photo, false)).toEqual({ src: photo.src, srcSet: undefined, side: 1600 });
    });

    it('asks the Netlify Image CDN for square crops from a fixed width ladder', () => {
        const { src, srcSet } = squareSources(photo, true);
        expect(src).toBe('/.netlify/images?url=%2Fmedia%2Fprojects%2Friver-house%2Fgarden.jpg&w=800&h=800&fit=cover&position=center');
        expect(srcSet!.split(', ').map((s) => s.split(' ')[1])).toEqual(['400w', '640w', '800w', '1200w', '1600w']);
        expect(srcSet).toContain('w=1200&h=1200&fit=cover');
    });

    it('never upscales: no crop is wider than the short side of the photo', () => {
        const { srcSet, src, side } = squareSources({ ...photo, width: 700, height: 1000 }, true);
        expect(side).toBe(700);
        expect(srcSet!.split(', ').map((s) => s.split(' ')[1])).toEqual(['400w', '640w', '700w']);
        expect(src).toContain('w=700&h=700');
    });

    it('passes the focus to the CDN crop', () => {
        expect(squareSources({ ...photo, focus: 'top' }, true).src).toContain('&position=top');
    });

    it('encodes non-ASCII file names', () => {
        expect(squareSources({ ...photo, src: '/media/projects/a/снимка 1.jpg' }, true).src).toContain('url=%2Fmedia%2Fprojects%2Fa%2F%D1%81');
    });
});
