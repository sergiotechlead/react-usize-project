// Skeleton loading placeholders for the Dashboard page.
//
// Two consumers:
//  1. `DashboardSkeleton` (default export) — the Suspense fallback for the
//     lazy-loaded DashboardPage route (see src/App/App.js). Reuses the exact
//     classnames from DashboardPage.css (.sidebar, .stats-grid, .stat-card,
//     .dist-card, .dash-card, .model-overview-grid, ...) via that CSS import
//     below, so its box sizes are pixel-identical to the real layout instead
//     of hand-duplicated numbers that could drift out of sync.
//  2. The named exports (`StatCardsSkeleton`, `SizeDistSkeleton`,
//     `PerModelOverviewSkeleton`, `ModelCardGridSkeleton`,
//     `IntegrationSkeleton`, `CustomizationSkeleton`, `PlanSkeleton`,
//     `TeamSkeleton`) are used *inside* DashboardPage.js's own section
//     components (Overview's three data-driven pieces, plus the AI Model,
//     Integration, Customization, Plan & Billing, and Team tabs) while their
//     respective fetches are in flight, swapped for the real content once
//     the fetch resolves. ProfileSection has no fetch on mount (it only
//     reads the already-loaded `user` prop) so it intentionally has no
//     skeleton counterpart here.
//
// Importing DashboardPage.css here (instead of re-declaring the same rules)
// is deliberate: this file is imported *eagerly* from App.js (so the
// skeleton is available the instant the route is requested, before the
// lazy DashboardPage JS chunk — which pulls in @tensorflow/tfjs, xlsx,
// @dnd-kit, etc. — has downloaded). That pulls DashboardPage.css into the
// main bundle too, but CSS alone is cheap; the JS code-splitting win (the
// whole point of lazy-loading Dashboard) is unaffected since none of the
// heavy JS dependencies are imported from here.
import './DashboardPage.css';
import './DashboardSkeleton.css';

const NAV_COUNT = 6; // overview / model / integration / customization / plan / profile
const SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
// Varying widths (not a uniform gray block) so the skeleton reads as
// "real content is loading" rather than a static placeholder.
const DIST_SKELETON_WIDTHS = [42, 68, 55, 24, 60, 33];
const MODEL_CARD_DIST_WIDTHS = [
  [50, 30, 65],
  [35, 60, 45],
];

export function StatCardsSkeleton() {
  return (
    <div className="stats-grid">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="stat-card">
          <div className="skel-box skel-line" style={{ width: '55%', height: 12, marginBottom: 6 }} />
          {/* .stat-value is the tallest/most prominent element (26px font) —
              keep this bar noticeably thicker than the label above it. */}
          <div className="skel-box" style={{ width: '40%', height: 27, marginBottom: 4, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function SizeDistSkeleton() {
  return (
    <div className="dist-card">
      <div className="skel-box skel-line" style={{ width: 150, height: 15, marginBottom: 16 }} />
      <div className="dist-bars">
        {SIZE_LABELS.map((size, i) => (
          <div key={size} className="dist-row">
            <span className="dist-size">{size}</span>
            <div className="dist-bar-track">
              <div className="skel-box" style={{ width: `${DIST_SKELETON_WIDTHS[i]}%`, height: '100%', borderRadius: 'var(--radius-full)' }} />
            </div>
            <span className="dist-pct"><span className="skel-box" style={{ width: 26, height: 12 }} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The real PerModelOverview returns null until models are known, and its
// final card count depends on how many models the user has trained — that
// count isn't knowable until the fetch resolves. This renders a fixed
// 2-card guess (reasonable given the grid's minmax(220px, 1fr) auto-fill
// still looks correct with any card count) rather than trying to predict
// the real number.
export function PerModelOverviewSkeleton() {
  return (
    <div className="model-overview-section">
      <div className="skel-box skel-line" style={{ width: 190, height: 15, marginBottom: 16 }} />
      <div className="model-overview-grid">
        {MODEL_CARD_DIST_WIDTHS.map((rowWidths, cardIdx) => (
          <div key={cardIdx} className="dash-card model-overview-card">
            <div className="skel-box skel-line" style={{ width: '65%', height: 15 }} />
            <div className="skel-box" style={{ width: 64, height: 20, borderRadius: 'var(--radius-full)' }} />
            <div className="dist-bars">
              {rowWidths.map((w, i) => (
                <div key={i} className="dist-row">
                  <span className="dist-size">{SIZE_LABELS[i]}</span>
                  <div className="dist-bar-track">
                    <div className="skel-box" style={{ width: `${w}%`, height: '100%', borderRadius: 'var(--radius-full)' }} />
                  </div>
                  <span className="dist-pct"><span className="skel-box" style={{ width: 26, height: 12 }} /></span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Model tab: model-list area ───────────────────────────────────────────
// Used inside ModelSection while `maxModels` (seeded from GET
// /subscriptions/current, see DashboardPage.js) is still null — that flag,
// not the models array itself, is the "have we loaded yet" signal because a
// brand-new account's real model list can legitimately be empty.
const MODEL_CARD_SKELETON_WIDTHS = [64, 48, 56]; // % width of each fake model name

// Every real .model-card also renders a compact <ArchitectureDiagram> below
// the row (5 nodes for the default [100,1000,100] architecture: input + 3
// dense + output, joined by 4 connectors) — omitting it here made the
// skeleton noticeably shorter than the real card once it loads (the bug
// the user flagged). Mirrors ArchitectureDiagram's own compact markup
// (.arch-diagram--compact/.arch-layer/.arch-node/.arch-connector) so the
// heights line up.
const ARCH_SKELETON_NODE_COUNT = 5;

function CompactArchDiagramSkeleton() {
  return (
    <div className="arch-diagram arch-diagram--compact" aria-hidden="true">
      {Array.from({ length: ARCH_SKELETON_NODE_COUNT }).map((_, i) => (
        <div className="arch-layer" key={i}>
          <div className="arch-node">
            <span className="skel-box" style={{ width: 16, height: 12 }} />
            <span className="skel-box" style={{ width: 22, height: 7 }} />
          </div>
          {i < ARCH_SKELETON_NODE_COUNT - 1 && (
            <div className="arch-connector" />
          )}
        </div>
      ))}
    </div>
  );
}

export function ModelCardGridSkeleton() {
  return (
    <div className="model-card-grid">
      {MODEL_CARD_SKELETON_WIDTHS.map((w, i) => (
        <div key={i} className="model-card">
          <div className="model-card-row">
            {/* Real .model-card-drag-handle is a button: 6px padding around
                a ~14px icon, so its footprint is ~26px square — not just the
                bare icon glyph. */}
            <div className="skel-box" style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }} />
            <div className="model-card-body">
              <div className="skel-box skel-line" style={{ width: `${w}%`, height: 13 }} />
              <div className="skel-box" style={{ width: 60, height: 17, borderRadius: 'var(--radius-full)' }} />
              <div className="skel-box skel-line" style={{ width: '38%', height: 11 }} />
            </div>
            <div className="model-card-actions">
              <div className="skel-box" style={{ width: 96, height: 29, borderRadius: 'var(--radius-md)' }} />
              <div className="skel-box" style={{ width: 78, height: 29, borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>
          <CompactArchDiagramSkeleton />
        </div>
      ))}
    </div>
  );
}

// ── Integration tab ──────────────────────────────────────────────────────────
// Whole-section skeleton (IntegrationSection has no gate today; a `loaded`
// flag was added alongside this to match the Promise.all/.finally pattern
// used by CustomizationSection/PlanSection/TeamSection).
const CODE_LINE_WIDTHS = [92, 68, 40, 86, 58, 74, 30];
const API_KEY_ROW_WIDTHS = [62, 48];

export function IntegrationSkeleton() {
  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <div className="skel-box skel-line" style={{ width: 150, height: 15, marginBottom: 16 }} />
          <div className="skel-box skel-line" style={{ width: '80%', height: 12, marginBottom: 18 }} />

          <div className="api-key-box">
            <div className="skel-box skel-line" style={{ width: '65%', height: 13 }} />
          </div>

          <div className="skel-box" style={{ width: 132, height: 32, borderRadius: 'var(--radius-md)', marginTop: 12 }} />

          <div style={{ marginTop: 14 }}>
            <div className="skel-box skel-line" style={{ width: 70, height: 11, marginBottom: 6 }} />
            {API_KEY_ROW_WIDTHS.map((w, i) => (
              <div key={i} className="api-key-row-item">
                <div className="skel-box skel-line" style={{ width: `${w}%`, height: 12 }} />
                <div className="skel-box" style={{ width: '100%', height: 30, borderRadius: 'var(--radius-md)' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card flex-grow">
          <div className="code-card-header">
            <div className="skel-box skel-line" style={{ width: 140, height: 15 }} />
            <div className="skel-box" style={{ width: 92, height: 28, borderRadius: 'var(--radius-md)' }} />
          </div>
          <div className="code-pre">
            {CODE_LINE_WIDTHS.map((w, i) => (
              <div key={i} className="skel-box skel-line" style={{ width: `${w}%`, height: 11, marginBottom: 8 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Customization tab ────────────────────────────────────────────────────────
// Two placeholder branding cards (real count depends on how many API keys the
// account has — unknowable before the fetch resolves, same reasoning as
// PerModelOverviewSkeleton's fixed 2-card guess above).
const BRAND_SWATCH_COUNT = 8;
const MODAL_BG_SWATCH_COUNT = 6;

function BrandingCardSkeleton({ cardKey }) {
  return (
    <div key={cardKey} className="dash-card branding-card">
      <div className="branding-card-header">
        <div className="branding-card-icon skel-box" style={{ width: 38, height: 38 }} />
        <div style={{ flex: 1 }}>
          <div className="skel-box skel-line" style={{ width: '60%', height: 14, marginBottom: 6 }} />
          <div className="skel-box skel-line" style={{ width: 90, height: 11 }} />
        </div>
      </div>

      <div className="skel-box" style={{ width: 116, height: 22, borderRadius: 'var(--radius-full)', marginBottom: 16 }} />

      <div className="custom-field">
        <div className="skel-box skel-line" style={{ width: 80, height: 12 }} />
        <div className="color-row">
          <div className="skel-box" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)' }} />
          <div className="skel-box" style={{ width: 110, height: 36, borderRadius: 'var(--radius-md)' }} />
        </div>
        <div className="color-swatch-row">
          {Array.from({ length: BRAND_SWATCH_COUNT }).map((_, s) => (
            <div key={s} className="skel-box" style={{ width: 22, height: 22, borderRadius: 'var(--radius-full)' }} />
          ))}
        </div>
      </div>

      <div className="custom-field">
        <div className="skel-box skel-line" style={{ width: 100, height: 12 }} />
        <div className="skel-box" style={{ width: '100%', height: 38, borderRadius: 'var(--radius-md)' }} />
      </div>

      <div className="custom-field">
        <div className="skel-box skel-line" style={{ width: 92, height: 12 }} />
        <div className="color-row">
          <div className="skel-box" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)' }} />
          <div className="skel-box" style={{ width: 110, height: 36, borderRadius: 'var(--radius-md)' }} />
        </div>
        <div className="color-swatch-row">
          {Array.from({ length: MODAL_BG_SWATCH_COUNT }).map((_, s) => (
            <div key={s} className="skel-box" style={{ width: 22, height: 22, borderRadius: 'var(--radius-full)' }} />
          ))}
        </div>
      </div>

      <div className="branding-save-row">
        <div className="skel-box" style={{ width: 96, height: 36, borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Real markup has a <p className="card-hint preview-label"> (margin-top
          18px, margin-bottom 8px) directly above .preview-mockup — reusing
          those two classes here (instead of faking the 18px gap via an
          inline margin-top on the mockup itself) keeps both margins and
          restores the ~30px of height the skeleton was previously missing. */}
      <div className="card-hint preview-label skel-box" style={{ width: 220, height: 12 }} />
      <div className="preview-mockup">
        <div className="preview-product-img skel-box" style={{ width: 80, height: 100 }} />
        <div className="preview-info">
          <div className="preview-line w60 skel-box" />
          <div className="preview-line w40 skel-box" />
          <div className="skel-box" style={{ width: 100, height: 32, borderRadius: 'var(--radius-md)', marginTop: 4 }} />
        </div>
      </div>
    </div>
  );
}

export function CustomizationSkeleton() {
  return (
    <div className="section-content">
      <div className="section-heading">
        <div className="skel-box skel-line" style={{ width: 190, height: 15, marginBottom: 8 }} />
        <div className="skel-box skel-line" style={{ width: '55%', height: 12 }} />
      </div>
      <div className="branding-card-grid">
        <BrandingCardSkeleton cardKey={0} />
        <BrandingCardSkeleton cardKey={1} />
      </div>
    </div>
  );
}

// ── Plan & Billing tab ───────────────────────────────────────────────────────
const PLAN_CARD_COUNT = 3;
const PLAN_FEATURE_WIDTHS = [72, 56];

export function PlanSkeleton() {
  return (
    <div className="section-content">
      <div className="dash-card plan-current-card">
        <div className="skel-box skel-line" style={{ width: 160, height: 15, marginBottom: 16 }} />
        <div className="plan-current-row">
          <div className="skel-box skel-line" style={{ width: 90, height: 20 }} />
          <div className="skel-box" style={{ width: 58, height: 22, borderRadius: 'var(--radius-full)' }} />
        </div>
        <div className="skel-box skel-line" style={{ width: 220, height: 12, marginBottom: 14 }} />
        <div className="billing-toggle">
          <div className="skel-box skel-line" style={{ width: 50, height: 13 }} />
          <div className="skel-box" style={{ width: 44, height: 24, borderRadius: 'var(--radius-full)' }} />
          <div className="skel-box skel-line" style={{ width: 40, height: 13 }} />
        </div>
      </div>

      <div className="plan-grid">
        {Array.from({ length: PLAN_CARD_COUNT }).map((_, i) => (
          <div key={i} className="dash-card plan-option-card">
            <div className="skel-box skel-line" style={{ width: '46%', height: 16 }} />
            <div className="skel-box skel-line" style={{ width: 66, height: 22 }} />
            <ul className="plan-option-features" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLAN_FEATURE_WIDTHS.map((w, j) => (
                <li key={j}><div className="skel-box skel-line" style={{ width: `${w}%`, height: 11 }} /></li>
              ))}
            </ul>
            <div className="skel-box" style={{ width: '100%', height: 36, borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Team tab (Enterprise-only) ───────────────────────────────────────────────
// Built from the admin view's shape (invite form + members table) since it's
// the richer of the two possible real layouts (admin vs. read-only member) —
// which one a given account will see isn't known until GET /organizations/me
// resolves.
const TEAM_ROW_EMAIL_WIDTHS = [64, 48, 70];

export function TeamSkeleton() {
  return (
    <div className="section-content">
      <div className="dash-card">
        <div className="skel-box skel-line" style={{ width: 130, height: 15, marginBottom: 8 }} />
        <div className="skel-box skel-line" style={{ width: '68%', height: 12, marginBottom: 16 }} />
        <div className="team-invite-row">
          <div className="custom-field" style={{ flex: 1, marginBottom: 0 }}>
            <div className="skel-box skel-line" style={{ width: 90, height: 12 }} />
            <div className="skel-box" style={{ width: '100%', height: 38, borderRadius: 'var(--radius-md)' }} />
          </div>
          <div className="custom-field" style={{ marginBottom: 0 }}>
            <div className="skel-box skel-line" style={{ width: 60, height: 12 }} />
            <div className="skel-box" style={{ width: 130, height: 38, borderRadius: 'var(--radius-md)' }} />
          </div>
          <div className="skel-box" style={{ width: 112, height: 38, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      <div className="dash-card">
        <div className="skel-box skel-line" style={{ width: 100, height: 15, marginBottom: 16 }} />
        <table className="team-members-table">
          <tbody>
            {TEAM_ROW_EMAIL_WIDTHS.map((w, i) => (
              <tr key={i}>
                <td><div className="skel-box skel-line" style={{ width: `${w}%`, height: 12 }} /></td>
                <td><div className="skel-box" style={{ width: 92, height: 28, borderRadius: 'var(--radius-md)' }} /></td>
                <td><div className="skel-box" style={{ width: 62, height: 20, borderRadius: 'var(--radius-full)' }} /></td>
                <td><div className="skel-box" style={{ width: 68, height: 13 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="sidebar" aria-hidden="true">
      <div className="sidebar-top">
        <div className="skel-sidebar-brand">
          <div className="brand-logo skel-box" style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)' }} />
          <div className="skel-box skel-line" style={{ width: 70, height: 17 }} />
        </div>
        <nav className="sidebar-nav">
          {Array.from({ length: NAV_COUNT }).map((_, i) => (
            <div key={i} className="sidebar-item skel-sidebar-item">
              <div className="skel-box" style={{ width: 16, height: 14, borderRadius: 3 }} />
              <div className="skel-box skel-line" style={{ width: '60%', height: 12 }} />
            </div>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar skel-box" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div className="user-info">
            <div className="skel-box skel-line" style={{ width: 80, height: 13, marginBottom: 4 }} />
            <div className="skel-box skel-line" style={{ width: 50, height: 11 }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

// Full-page skeleton used as the Suspense fallback for the /dashboard route
// (src/App/App.js) — shown while the DashboardPage JS chunk itself is still
// downloading, so it needs to stand alone (sidebar + topbar + body), unlike
// the section-level skeletons above which slot into an already-rendered
// DashboardPage shell.
export default function DashboardSkeleton() {
  return (
    <div className="dashboard">
      <SidebarSkeleton />
      <main className="dash-main">
        <div className="dash-topbar">
          <div className="skel-box skel-line" style={{ width: 160, height: 22, marginBottom: 8 }} />
          <div className="skel-box skel-line" style={{ width: 220, height: 13 }} />
        </div>
        <div className="dash-body">
          <StatCardsSkeleton />
          <SizeDistSkeleton />
          <PerModelOverviewSkeleton />
        </div>
      </main>
    </div>
  );
}
