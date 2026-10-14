// Tailwind preset for both apps: maps utilities onto the CSS custom properties in
// src/styles/tokens.css. Rules live in DESIGN.md. Colours reference variables only.

// Lets opacity modifiers (bg-ink/50) work on CSS-variable colours.
const token = (name: string) => `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;

export default {
    theme: {
        extend: {
            colors: {
                paper: token('--bg'),
                field: token('--field'),
                wall: token('--wall'),
                ink: token('--text'),
                muted: token('--muted'),
                faint: token('--faint'),
                line: 'var(--line)',
                'line-2': 'var(--line-2)',
                accent: token('--accent'),
                'on-accent': token('--on-accent'),
                panel: token('--panel'),
                'on-panel': token('--on-panel'),
                neg: token('--neg')
            },
            borderColor: { DEFAULT: 'var(--line)' },
            ringColor: { DEFAULT: token('--accent') },
            fontFamily: {
                display: ['var(--f-display)', 'Iowan Old Style', 'Georgia', 'serif'],
                sans: ['var(--f-body)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
                mono: ['var(--f-mono)', 'ui-monospace', 'Menlo', 'monospace']
            },
            borderRadius: { none: '0', DEFAULT: 'var(--radius)', chip: 'var(--radius-chip)' },
            transitionDuration: {
                DEFAULT: 'var(--dur-standard)',
                micro: 'var(--dur-micro)',
                standard: 'var(--dur-standard)',
                reveal: 'var(--dur-reveal)'
            },
            transitionTimingFunction: { DEFAULT: 'var(--ease)' }
        }
    }
};
