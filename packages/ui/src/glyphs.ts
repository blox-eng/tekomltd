// Line glyphs, 48x48, stroke only. Inner SVG markup copied unchanged from design/mockup/mockup.tpl.html (ICON).
// All strings are trusted constants; Glyph renders them with dangerouslySetInnerHTML.
export const GLYPHS = {
    plumb: '<circle cx="24" cy="6" r="2"/><path d="M24 8v10"/><path d="M24 18l-6 8 6 14 6-14z"/><path d="M18 26h12"/>',
    trowel: '<rect x="8" y="28" width="32" height="8"/><path d="M24 28v-8"/><rect x="17" y="10" width="14" height="10" rx="5"/>',
    boards: '<rect x="8" y="9" width="30" height="8"/><rect x="10" y="20" width="30" height="8"/><rect x="8" y="31" width="30" height="8"/><path d="M40 13h2M42 24h-2M40 35h2"/>',
    roller: '<rect x="8" y="8" width="26" height="10" rx="2"/><path d="M34 13h5v10H24v5"/><rect x="21" y="28" width="6" height="13" rx="2"/>',
    tiles: '<rect x="8" y="8" width="32" height="32"/><path d="M8 24h32M24 8v32"/><path d="M12 12l4 4M28 28l4 4"/>',
    spatula: '<path d="M9 36l5-14h20l5 14z"/><path d="M24 22v-8"/><rect x="18" y="7" width="12" height="7" rx="3.5"/>',
    hat: '<path d="M11 32a13 13 0 0 1 26 0"/><path d="M20 20v-3h8v3"/><path d="M6 32h36v4H6z"/>',
    brick: '<rect x="6" y="12" width="36" height="24"/><path d="M6 20h36M6 28h36M18 12v8M30 20v8M18 28v8"/>',
    truss: '<path d="M6 34L24 14l18 20z"/><path d="M24 14v20M15 24l9 10 9-10"/>',
    key: '<circle cx="15" cy="24" r="8"/><path d="M23 24h19M36 24v7M41 24v5"/>',
    ledger: '<path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z"/><path d="M10 36a4 4 0 0 1 4-4h24M18 16h12M18 22h12"/>',
    laptop: '<rect x="10" y="10" width="28" height="19" rx="1"/><path d="M5 33h38l-3 5H8z"/><path d="M21 35.5h6"/>',
    blueprint: '<rect x="8" y="8" width="32" height="32"/><path d="M8 16h32M16 8v32"/><path d="M22 22h12v12H22z" stroke-dasharray="2 2"/>',
    square: '<path d="M8 40V8l32 32z"/><path d="M14 34V22l12 12z"/>',
    beam: '<path d="M8 10h32v5H27v18h13v5H8v-5h13V15H8z"/>',
    permit: '<path d="M12 6h18l8 8v28H12z"/><path d="M30 6v8h8"/><circle cx="25" cy="30" r="5"/><path d="M18 18h10"/>',
    survey: '<rect x="18" y="8" width="12" height="8"/><path d="M24 16v6M24 22l-10 20M24 22l10 20M24 22v20"/>',
    bolt: '<path d="M27 6L13 27h10l-3 15 15-22H25z"/>',
    drop: '<path d="M24 6c6 10 12 16 12 23a12 12 0 0 1-24 0c0-7 6-13 12-23z"/>',
    air: '<path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18"/><path d="M20 9l4 4 4-4M20 39l4-4 4 4"/>',
    window: '<rect x="10" y="6" width="28" height="36"/><path d="M24 6v36M10 24h28"/>',
    kitchen: '<rect x="6" y="22" width="36" height="20"/><path d="M6 30h36M24 22v20"/><circle cx="15" cy="12" r="3"/><circle cx="33" cy="12" r="3"/>',
    leaf: '<path d="M12 36C12 18 24 10 38 10c0 16-10 26-26 26z"/><path d="M12 36l16-16"/>',
    solar: '<path d="M8 34l6-18h20l6 18z"/><path d="M11 25h26M20 16l-2 18M28 16l2 18"/><path d="M24 34v8"/>',
    tree: '<circle cx="24" cy="18" r="11"/><path d="M24 29v13M18 42h12"/>'
} as const;

export type GlyphKey = keyof typeof GLYPHS;

export const CREW_GLYPH_KEYS = [
    'plumb',
    'trowel',
    'boards',
    'roller',
    'tiles',
    'spatula',
    'hat',
    'brick',
    'truss',
    'key',
    'ledger',
    'square',
    'laptop'
] as const satisfies readonly GlyphKey[];
export const SERVICE_GLYPH_KEYS = [
    'blueprint',
    'square',
    'beam',
    'permit',
    'survey',
    'bolt',
    'drop',
    'air',
    'window',
    'kitchen',
    'leaf',
    'solar',
    'tree'
] as const satisfies readonly GlyphKey[];
