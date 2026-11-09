/** Whole calendar years a finished project has stood; the year it was finished counts as 0. */
export function yearsStood(year: number, now: Date): number {
    return Math.max(0, now.getFullYear() - year);
}

export type TimelineTick = { slug: string; title: string; year: number; at: number; stack: number };

/** One tick per dated project, placed between the first year and today; projects of the same year stack upward. */
export function timeline(projects: { slug: string; title: string; year: number | null }[], now: Date) {
    const dated = projects.filter((p): p is typeof p & { year: number } => p.year !== null).sort((a, b) => a.year - b.year);
    if (dated.length === 0) return null;
    const first = dated[0]!.year;
    const today = now.getFullYear();
    const span = Math.max(1, today - first);
    const perYear = new Map<number, number>();
    const ticks: TimelineTick[] = dated.map(({ slug, title, year }) => {
        const stack = perYear.get(year) ?? 0;
        perYear.set(year, stack + 1);
        return { slug, title, year, at: ((year - first) / span) * 100, stack };
    });
    return { first, today, years: today - first, ticks };
}
