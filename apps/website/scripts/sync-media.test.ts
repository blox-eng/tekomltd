import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { syncMedia } from './sync-media';

const root = join(__dirname, '..', 'src', 'content', '__fixtures__', 'loader');

describe('syncMedia', () => {
    const out = mkdtempSync(join(tmpdir(), 'media-'));
    const copied = syncMedia(root, out);

    it('copies a nested image to the same relative path', () => {
        expect(existsSync(join(out, 'projects', 'green-bath-eye-clinic', 'gallery', 'second.png'))).toBe(true);
        expect(copied).toBeGreaterThan(0);
    });
    it('copies pdfs', () => expect(existsSync(join(out, 'publications', 'notice.pdf'))).toBe(true));
    it('copies office documents', () => expect(existsSync(join(out, 'publications', 'form.docx'))).toBe(true));
    it('does not copy yaml or markdown', () => {
        expect(readdirSync(out)).not.toContain('home.yaml');
        expect(existsSync(join(out, 'legal'))).toBe(false);
        expect(existsSync(join(out, 'projects', 'old-town-house', 'project.yaml'))).toBe(false);
    });
    it('does nothing when the content folder is missing', () => expect(syncMedia(join(out, 'nope'), join(out, 'x'))).toBe(0));
});
