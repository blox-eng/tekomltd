import { GLYPHS, type GlyphKey } from './glyphs';

export function Glyph({ name, className }: { name: GlyphKey; className?: string }) {
    return (
        <svg
            className={className ? `glyph ${className}` : 'glyph'}
            viewBox="0 0 48 48"
            aria-hidden="true"
            // GLYPHS are trusted constants, never user input.
            dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
        />
    );
}
