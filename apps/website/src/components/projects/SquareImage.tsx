import type { ProjectImg } from '@/content/cards';
import { OBJECT_POSITION, squareSources } from './square';

type Props = { image: ProjectImg; sizes: string; eager?: boolean };

/** Netlify sets NETLIFY=true while it builds; elsewhere (dev, e2e) the browser crops the original file. */
const CDN = process.env.NETLIFY === 'true';

/** A 1:1 thumbnail: the CDN serves a square crop, and CSS keeps the box square either way. */
export function SquareImage({ image, sizes, eager = false }: Props) {
    const { src, srcSet, side } = squareSources(image, CDN);
    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={srcSet && sizes}
            width={side}
            height={side}
            alt={image.alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            style={{ objectPosition: OBJECT_POSITION[image.focus] }}
        />
    );
}
