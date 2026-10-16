import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { writeShareImages } from './share-images';

const root = join(__dirname, '..', '..', '..', 'tests', 'fixtures', 'content');

describe('writeShareImages', () => {
    const out = mkdtempSync(join(tmpdir(), 'og-'));
    let count = 0;
    beforeAll(async () => {
        count = await writeShareImages(root, out);
    }, 60_000);

    it('writes one file per distinct photo and wordmark', () => {
        expect(count).toBeGreaterThan(0);
        expect(readdirSync(out)).toHaveLength(count);
    });
    it('writes 1200×630 JPEGs small enough for WhatsApp', async () => {
        for (const file of readdirSync(out)) {
            const meta = await sharp(readFileSync(join(out, file))).metadata();
            expect(meta).toMatchObject({ format: 'jpeg', width: 1200, height: 630 });
            expect(statSync(join(out, file)).size).toBeLessThan(300_000);
        }
    });
});
