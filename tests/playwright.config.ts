import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

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
    // Serves the production build: the site is static, so the e2e run tests what ships.
    webServer: {
        command: 'pnpm --filter @tekom/website build && pnpm --filter @tekom/website start',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        cwd: '..',
        timeout: 300_000
    }
});
