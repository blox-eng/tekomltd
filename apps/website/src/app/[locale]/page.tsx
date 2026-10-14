import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CREW_GLYPH_KEYS, type GlyphKey } from '@tekom/ui';
import type { Locale } from '@tekom/i18n';
import { CrewStatSlide } from '@/components/rail/CrewStatSlide';
import { PanelSlide } from '@/components/rail/PanelSlide';
import { ProjectSlide } from '@/components/rail/ProjectSlide';
import { Rail } from '@/components/rail/Rail';
import { buildRail, collageTools } from '@/components/rail/rail';
import { getHome } from '@/content/home';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

const isGlyph = (tool: string): tool is GlyphKey => (CREW_GLYPH_KEYS as readonly string[]).includes(tool);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home' });
    return { title: { absolute: t('title') } };
}

export default async function HomePage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const [t, nav, scope, crewT, railT] = await Promise.all([
        getTranslations({ locale, namespace: 'home' }),
        getTranslations({ locale, namespace: 'nav' }),
        getTranslations({ locale, namespace: 'scope' }),
        getTranslations({ locale, namespace: 'crew' }),
        getTranslations({ locale, namespace: 'rail' })
    ]);
    const { rail, panels, crews } = getHome(locale);

    const items = buildRail(rail, panels);
    const tools = crews.flatMap((crew) => crew.roles.map((role) => role.tool)).filter(isGlyph);
    const scopeLabels = Object.fromEntries((['full', 'restore', 'facade', 'interior', 'stone'] as const).map((key) => [key, scope(key)]));
    let crewSlides = 0;

    return (
        <Rail
            label={nav('projects')}
            count={items.length}
            prevLabel={railT('prev')}
            nextLabel={railT('next')}
            more={
                <Link href="/projects" className="ghost">
                    {t('allProjects')}
                    <span className="ar" aria-hidden="true">
                        →
                    </span>
                </Link>
            }
        >
            {items.map((item, i) => {
                if (item.kind === 'project') return <ProjectSlide key={item.project.slug} project={item.project} scopeLabels={scopeLabels} first={i === 0} />;
                if (item.kind === 'panel') {
                    const { label, title, body, accent } = item.panel;
                    return <PanelSlide key={`panel-${i}`} label={label} title={title} body={body} accent={accent} contactLabel={nav('contact')} />;
                }
                return (
                    <CrewStatSlide
                        key={`crew-${i}`}
                        value={item.panel.statValue}
                        unit={item.panel.unit}
                        body={item.panel.body}
                        tools={collageTools(tools, crewSlides++)}
                        stampLabel={crewT('photoPending')}
                    />
                );
            })}
        </Rail>
    );
}
