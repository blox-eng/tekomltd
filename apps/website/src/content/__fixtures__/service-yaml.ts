/** A minimal service file; `projects` is the YAML of its filter. */
export const serviceYaml = (slug: string, projects: string, extra = '') => `slug: ${slug}
projects: ${projects}
${extra}
name: { bg: Име ${slug} }
nav_blurb: { bg: Кратко }
meta_title: { bg: Заглавие }
meta_description: { bg: Описание }
h1: { bg: Заглавие ${slug} }
intro: { bg: Увод }
benefits: [{ title: { bg: Полза }, body: { bg: Текст } }]
steps_title: { bg: Стъпки }
steps: [{ title: { bg: Стъпка }, body: { bg: Текст } }]
materials_title: { bg: Материали }
materials: { bg: Текст }
projects_title: { bg: Проекти }
cta: { title: { bg: Пишете ни }, body: { bg: Текст }, button: { bg: Оферта } }
`;
