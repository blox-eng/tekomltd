import type { Locale } from '@tekom/i18n';
import type { ProjectDetail } from '@/content/projects';

export type Fact = { key: 'address' | 'completed' | 'area' | 'scope'; label: string; value: string };

type FactSource = Pick<ProjectDetail, 'address' | 'place' | 'year' | 'areaM2' | 'scopes'>;
type FactLabels = { address: string; completed: string; area: string; scope: string };

/** Only the facts a project has; a missing one is left out, never printed as empty. */
export function projectFacts(project: FactSource, labels: FactLabels, scopeLabels: Record<string, string>, locale: Locale): Fact[] {
    const number = new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : locale === 'de' ? 'de-DE' : 'en-GB');
    const rows: (Fact | null)[] = [
        { key: 'address', label: labels.address, value: [project.address, project.place].filter(Boolean).join(', ') },
        project.year === null ? null : { key: 'completed', label: labels.completed, value: String(project.year) },
        project.areaM2 === null ? null : { key: 'area', label: labels.area, value: `${number.format(project.areaM2)} m²` },
        project.scopes.length === 0 ? null : { key: 'scope', label: labels.scope, value: project.scopes.map((s) => scopeLabels[s]).join(', ') }
    ];
    return rows.filter((row): row is Fact => row !== null && row.value !== '');
}

/** One note when the Bulgarian text stands in for a missing translation. */
export function fallbackNote(
    { titleFallback, summaryFallback }: { titleFallback: boolean; summaryFallback: boolean },
    keys: { note: string; inBulgarian: string }
): string | null {
    if (summaryFallback) return keys.inBulgarian;
    return titleFallback ? keys.note : null;
}
