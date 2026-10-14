import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Workspace packages ship TypeScript source.
    transpilePackages: ['@tekom/ui', '@tekom/i18n']
};

export default withNextIntl(nextConfig);
