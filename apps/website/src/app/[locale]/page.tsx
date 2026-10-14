import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CREW_GLYPH_KEYS, type GlyphKey } from '@tekom/ui';
import type { Locale } from '@tekom/i18n';
import { Crews } from '@/components/home/Crews';
import { formatStat } from '@/components/home/format';
import { PartnerServices } from '@/components/home/PartnerServices';
import { PromiseSection } from '@/components/home/Promise';
import { Stats } from '@/components/home/Stats';
import { Trust } from '@/components/home/Trust';
import { MapSection } from '@/components/map/MapSection';
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
    const { rail, panels, promises, stats, crews, partnerServices, brands, partners, settings } = getHome(locale);

    const items = buildRail(rail, panels);
    const tools = crews.flatMap((crew) => crew.roles.map((role) => role.tool)).filter(isGlyph);
    const scopeLabels = Object.fromEntries((['full', 'restore', 'facade', 'interior', 'stone'] as const).map((key) => [key, scope(key)]));
    let crewSlides = 0;

    return (
        <>
            <h1 className="sr">{t('title')}</h1>
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
                    if (item.kind === 'project')
                        return <ProjectSlide key={item.project.slug} project={item.project} scopeLabels={scopeLabels} first={i === 0} />;
                    if (item.kind === 'panel') {
                        const { label, title, body, accent } = item.panel;
                        return <PanelSlide key={`panel-${i}`} label={label} title={title} body={body} accent={accent} contactLabel={nav('contact')} />;
                    }
                    return (
                        <CrewStatSlide
                            key={`crew-${i}`}
                            value={formatStat(item.panel.statValue, locale, item.panel.unconfirmed)}
                            unit={item.panel.unit}
                            body={item.panel.body}
                            tools={collageTools(tools, crewSlides++)}
                            stampLabel={crewT('photoPending')}
                        />
                    );
                })}
            </Rail>
            <div className="wrap">
                <PromiseSection locale={locale} promises={promises} />
                <Stats locale={locale} stats={stats} />
                <Crews locale={locale} crews={crews} headline={settings.crewHeadline} />
                <PartnerServices locale={locale} services={partnerServices} prevLabel={railT('prev')} nextLabel={railT('next')} />
                <MapSection locale={locale} cards={rail} />
                <Trust locale={locale} brands={brands} partners={partners} />
            </div>
        </>
    );
}
