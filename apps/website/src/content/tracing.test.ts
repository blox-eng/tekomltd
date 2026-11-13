import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

// A page rendered on request (a 404, an ISR refresh) runs in the server function, which holds only the files listed here.
// Every kind of file a content loader reads must be on the list, or the page answers 500 in production.
describe('outputFileTracingIncludes', () => {
    const globs = nextConfig.outputFileTracingIncludes?.['/**'] ?? [];
    it.each(['yaml', 'md', 'svg'])('carries the .%s files of content/', (ext) => expect(globs).toContain(`../../content/**/*.${ext}`));
});
