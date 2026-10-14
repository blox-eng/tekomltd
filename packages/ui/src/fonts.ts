import { Cormorant_Garamond, IBM_Plex_Mono, Sofia_Sans } from 'next/font/google';

// next/font needs literal options, so the subsets repeat.
export const display = Cormorant_Garamond({
    subsets: ['latin', 'cyrillic'],
    weight: ['400', '500'],
    style: ['normal', 'italic'],
    display: 'swap',
    variable: '--f-display'
});
export const body = Sofia_Sans({ subsets: ['latin', 'cyrillic'], weight: ['300', '400', '500', '600'], display: 'swap', variable: '--f-body' });
export const mono = IBM_Plex_Mono({ subsets: ['latin', 'cyrillic'], weight: ['400', '500'], display: 'swap', variable: '--f-mono' });
