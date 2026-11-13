import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// The repo is public. An architect drawing holds dimensions, structure, installations and names: it never enters git.
describe('the repository', () => {
    it('tracks no DXF or DWG file', () => {
        const files = execFileSync('git', ['ls-files', '--full-name', ':/'], { encoding: 'utf8' }).split('\n');
        expect(files.filter((f) => /\.(dxf|dwg)$/i.test(f))).toEqual([]);
    });
});
