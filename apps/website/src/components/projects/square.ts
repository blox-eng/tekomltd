import type { Focus, ProjectImg } from '@/content/cards';

export const OBJECT_POSITION: Record<Focus, string> = {
    center: '50% 50%',
    top: '50% 0%',
    bottom: '50% 100%',
    left: '0% 50%',
    right: '100% 50%'
};

/** One ladder for every page, so each crop has one URL and the CDN cache is shared. */
const WIDTHS = [400, 640, 800, 1200, 1600];
const DEFAULT_WIDTH = 800;

const cdnUrl = (src: string, side: number, focus: Focus) =>
    `/.netlify/images?${new URLSearchParams({ url: src, w: String(side), h: String(side), fit: 'cover', position: focus })}`;

/** Square crops from the Netlify Image CDN, never wider than the short side of the photo; the original file without a CDN. */
export function squareSources(image: ProjectImg, cdn: boolean) {
    const side = Math.min(image.width, image.height);
    if (!cdn) return { src: image.src, srcSet: undefined, side };
    const widths = [...WIDTHS.filter((w) => w < side), Math.min(side, WIDTHS.at(-1)!)];
    return {
        src: cdnUrl(image.src, Math.min(side, DEFAULT_WIDTH), image.focus),
        srcSet: widths.map((w) => `${cdnUrl(image.src, w, image.focus)} ${w}w`).join(', '),
        side
    };
}
