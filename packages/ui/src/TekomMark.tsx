// The solid T: an isometric T in one ink, faces at 100% / 52% / 28%. DESIGN.md §12.
export const MARK_FACES = [
    { d: 'M12 8.7L16.4 10.9L12 13.1L7.6 10.9Z', opacity: 1 },
    { d: 'M7.6 10.9L12 13.1L12 21.9L7.6 19.7Z', opacity: 0.52 },
    { d: 'M16.4 10.9L12 13.1L12 21.9L16.4 19.7Z', opacity: 0.28 },
    { d: 'M7.6 2.1L20.8 8.7L16.4 10.9L3.2 4.3Z', opacity: 1 },
    { d: 'M3.2 4.3L16.4 10.9L16.4 15.3L3.2 8.7Z', opacity: 0.52 },
    { d: 'M20.8 8.7L16.4 10.9L16.4 15.3L20.8 13.1Z', opacity: 0.28 }
] as const;

export function TekomMark({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {MARK_FACES.map(({ d, opacity }) => (
                <path key={d} d={d} opacity={opacity} />
            ))}
        </svg>
    );
}
