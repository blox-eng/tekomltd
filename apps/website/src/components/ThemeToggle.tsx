'use client';

export function ThemeToggle() {
    const toggle = () => {
        const root = document.documentElement;
        const current = root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = current === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try {
            localStorage.setItem('tekom-theme', next);
        } catch {
            // Storage can be blocked; the choice then lasts for this page only.
        }
    };

    return (
        <button type="button" className="theme" aria-label="Switch light or dark theme" onClick={toggle}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            </svg>
        </button>
    );
}
