import { defineConfig, devices } from '@playwright/test';

const SITE_URL = process.env.SITE_URL;
if (!SITE_URL) throw new Error('Set SITE_URL, for example SITE_URL=https://tekomltd-website.netlify.app');

// Runs against a site that is already up: no local server is started.
export default defineConfig({
    testDir: './e2e/website',
    testMatch: 'smoke.spec.ts',
    fullyParallel: true,
    retries: 1,
    reporter: 'line',
    use: { baseURL: SITE_URL },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
