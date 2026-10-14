import { parse, type HTMLElement } from 'node-html-parser';
import TurndownService from 'turndown';
import { decodeEntities } from '../wp-parse';
import { SITE, sitePath } from './wp';

const DOCUMENT = /\.(pdf|docx?|xlsx?)$/i;
const IMAGE = /\.(jpe?g|png|webp|gif)$/i;
const SIZE_SUFFIX = /-\d+x\d+(\.[a-z]+)$/i;

/** Avada and WordPress chrome that is not page content: tab navigation, the portfolio grid, the enquiry form. */
const CHROME = [
    'script',
    'style',
    'noscript',
    'form',
    '.nav',
    '.nav-tabs',
    '.fusion-mobile-tab-nav',
    '.screen-reader-response',
    '.fusion-alert',
    '.fusion-portfolio'
];

export type MarkdownContext = {
    /** New public URL of a document, by its old URL; with its publication title. */
    document: (url: string) => { href: string; title: string } | null;
    /** Saves an image of the page and returns its new public URL. */
    image: (url: string) => Promise<string>;
    /** New address of an old link inside the site (a page path), or null to keep the link as it is. */
    sitePage: (path: string) => string | null;
};

const isUpload = (url: string) => url.startsWith(`${SITE}/wp-content/uploads/`);
/** A rendered page of a document, shown next to its download link ("…-pdf-724x1024.jpg"). */
const isDocumentPreview = (src: string) => /-pdf(-\d+x\d+)?\.(jpe?g|png)$/i.test(decodeURI(src));
/** Alt texts that are only a file name ("services-tabs-139154408"). */
const isFileNameAlt = (alt: string) => /^[\w.-]+$/.test(alt) && /\d/.test(alt) && !/\s/.test(alt);

/**
 * Converts the rendered HTML of a WordPress page to Markdown. Drops the Avada chrome and the enquiry form; keeps the text,
 * headings, lists, links and images. Images are saved into the content folder; document links point at the imported publication.
 */
export async function wpPageToMarkdown(html: string, ctx: MarkdownContext): Promise<string> {
    const root = parse(html);
    for (const container of root.querySelectorAll('.fusion-fullwidth')) if (container.querySelector('.wpcf7, form')) container.remove();
    for (const selector of CHROME) for (const node of root.querySelectorAll(selector)) node.remove();

    for (const br of root.querySelectorAll('h1 br, h2 br, h3 br, h4 br, h5 br, h6 br')) br.replaceWith(' ');

    for (const a of root.querySelectorAll('a')) {
        const href = decodeEntities(a.getAttribute('href') ?? '');
        const img = a.querySelector('img');
        if (!a.text.trim() && !img) {
            a.remove();
        } else if (isUpload(href) && DOCUMENT.test(href)) {
            const doc = ctx.document(href);
            if (!doc) throw new Error(`no imported document for ${href}`);
            if (img) {
                a.remove(); // a preview picture of the document; the download link next to it stays
                continue;
            }
            a.setAttribute('href', doc.href);
            // The live link text is the button label „ИЗТЕГЛИ“; the document's title says what it is.
            if (a.text.trim().toUpperCase() === 'ИЗТЕГЛИ') a.set_content(escapeHtml(doc.title));
        } else if (isUpload(href) && IMAGE.test(href) && img) {
            img.setAttribute('src', href); // the link opens the full picture: show that one
            a.replaceWith(img);
        } else if (href.startsWith(SITE)) {
            const target = ctx.sitePage(sitePath(href));
            if (target) a.setAttribute('href', target);
        } else if (href.startsWith('#')) {
            a.replaceWith(a.innerHTML);
        }
    }

    for (const img of root.querySelectorAll('img')) {
        const src = decodeEntities(img.getAttribute('data-orig-src') ?? img.getAttribute('src') ?? '');
        if (!isUpload(src) || isDocumentPreview(src)) {
            removeWithEmptyLink(img);
            continue;
        }
        const alt = decodeEntities(img.getAttribute('alt') ?? '').trim();
        const replacement = parse(`<img src="${await ctx.image(src.replace(SIZE_SUFFIX, '$1'))}" alt="${escapeHtml(isFileNameAlt(alt) ? '' : alt)}">`);
        img.replaceWith(replacement);
    }

    return tidy(turndown().turndown(root.toString()));
}

function removeWithEmptyLink(img: HTMLElement) {
    const parent = img.parentNode;
    img.remove();
    if (parent?.rawTagName === 'a' && !parent.text.trim() && !parent.querySelector('img')) parent.remove();
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function turndown() {
    const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '_', strongDelimiter: '**', codeBlockStyle: 'fenced', br: '\\' });
    td.remove(['script', 'style', 'noscript', 'iframe', 'button', 'input', 'textarea', 'select']);
    return td;
}

/** Collapses the whitespace Avada leaves behind; drops empty headings, empty list items and bold inside headings. */
function tidy(markdown: string): string {
    return (
        markdown
            .split('\n')
            .map((line) => line.replace(/[ \t]+$/g, '').replace(/\u00a0/g, ' '))
            .map((line) => (/^#{1,6}\s/.test(line) ? line.replace(/\*\*/g, '') : line))
            .filter((line) => !/^#{1,6}\s*$/.test(line) && !/^-\s*$/.test(line))
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim() + '\n'
    );
}
