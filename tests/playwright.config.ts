import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

/** The e2e suite runs on this fixed content, never on content/: a content-only pull request cannot break it. */
const FIXTURE_CONTENT = resolve(__dirname, 'fixtures', 'content');

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: 0,
    reporter: 'line',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    // Builds and serves the fixture content in production mode: the site is static, so the e2e run tests what ships.
    // A server that is already running may serve other content, so it is never reused.
    webServer: {
        command: `pnpm --filter @tekom/website build && pnpm --filter @tekom/website start --port ${new URL(BASE_URL).port || 3000}`,
        url: BASE_URL,
        reuseExistingServer: false,
        cwd: '..',
        timeout: 300_000,
        env: { CONTENT_ROOT: FIXTURE_CONTENT }
    }
});
