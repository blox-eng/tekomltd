import { describe, expect, it } from 'vitest';
import { shareFile, shareImage, type SharePhoto } from './share';

const photo: SharePhoto = { src: '/media/projects/x/front.jpg', width: 2000, height: 1500, alt: 'Фасада', focus: 'center' };

describe('shareFile', () => {
    it('is stable for the same photo', () => expect(shareFile(photo, 'bg')).toBe(shareFile({ ...photo }, 'bg')));
    it('changes with the photo or its focus, so platforms refetch', () => {
        expect(shareFile({ ...photo, src: '/media/projects/x/back.jpg' }, 'bg')).not.toBe(shareFile(photo, 'bg'));
        expect(shareFile({ ...photo, focus: 'top' }, 'bg')).not.toBe(shareFile(photo, 'bg'));
    });
    it('follows the wordmark: Cyrillic for bg, one Latin file for en and de', () => {
        expect(shareFile(photo, 'en')).toBe(shareFile(photo, 'de'));
        expect(shareFile(photo, 'bg')).not.toBe(shareFile(photo, 'en'));
    });
});

describe('shareImage', () => {
    it('points at the 1200×630 file and keeps the photo alt', () => {
        expect(shareImage(photo, 'bg')).toEqual({ url: `/og/${shareFile(photo, 'bg')}`, width: 1200, height: 630, alt: 'Фасада' });
    });
});
