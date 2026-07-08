// Maps each dashboard tab id (used internally + as the i18n `nav.<id>` key)
// to the URL slug it's addressable at: /dashboard-<slug>. Shared between
// App.js (route registration) and DashboardPage.js (sidebar nav + active-tab
// resolution) so the two can't drift out of sync.
export const DASHBOARD_SECTIONS = [
  { id: 'overview',      slug: 'overview' },
  { id: 'model',         slug: 'ai-model' },
  { id: 'integration',   slug: 'integration' },
  { id: 'customization', slug: 'customization' },
  { id: 'plan',          slug: 'plan-billing' },
  { id: 'profile',       slug: 'profile' },
  { id: 'team',          slug: 'team' },
];

export const DASHBOARD_SLUG_BY_ID = Object.fromEntries(
  DASHBOARD_SECTIONS.map(({ id, slug }) => [id, slug])
);

export const DASHBOARD_ID_BY_SLUG = Object.fromEntries(
  DASHBOARD_SECTIONS.map(({ id, slug }) => [slug, id])
);
