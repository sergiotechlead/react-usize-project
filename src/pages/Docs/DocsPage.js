import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faCode, faDatabase, faGear, faPuzzlePiece,
  faCircleInfo, faTriangleExclamation, faCircleCheck,
  faCopy, faBars, faXmark, faBook,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation, Trans } from 'react-i18next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { usePageTitle } from '../../hooks/usePageTitle';
import './DocsPage.css';

const SECTION_ICONS = {
  intro: faBook,
  quickstart: faBolt,
  training: faDatabase,
  options: faGear,
  api: faCode,
  integration: faPuzzlePiece,
  faq: faCircleInfo,
};

function CodeBlock({ lang, code, label }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation('docs');
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="doc-code-block">
      <div className="doc-code-bar">
        <span className="doc-code-lang">{lang || label}</span>
        <button className="doc-code-copy" onClick={copy} aria-live="polite">
          <FontAwesomeIcon icon={faCopy} /> {copied ? t('copied') : t('copy')}
        </button>
      </div>
      <pre className="doc-code-pre"><code>{code}</code></pre>
    </div>
  );
}

function Callout({ type, children }) {
  const icons = { info: faCircleInfo, warning: faTriangleExclamation, success: faCircleCheck };
  return (
    <div className={`doc-callout doc-callout--${type}`}>
      <FontAwesomeIcon icon={icons[type] || faCircleInfo} className="callout-icon" />
      <div>{children}</div>
    </div>
  );
}

export default function DocsPage() {
  const location = useLocation();
  const [active, setActive] = useState('intro');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation('docs');

  const SECTION_IDS = ['intro', 'quickstart', 'training', 'options', 'api', 'integration', 'faq'];

  useEffect(() => {
    const section = location.state?.section;
    if (section && SECTION_IDS.includes(section)) setActive(section);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function navTo(id) {
    setActive(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  usePageTitle(`${t(`sections.${active}`)} — ${t('pageTitle')}`);

  return (
    <div className="docs-page">
      <Navbar activePage="docs" />

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className={`docs-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="docs-sidebar-header">
            <span>{t('sidebar')}</span>
            <button className="docs-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label={t('closeSidebar')}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <nav className="docs-sidebar-nav">
            {SECTION_IDS.map(id => (
              <button
                key={id}
                className={`docs-nav-item${active === id ? ' is-active' : ''}`}
                onClick={() => navTo(id)}
                aria-current={active === id ? 'page' : undefined}
              >
                <FontAwesomeIcon icon={SECTION_ICONS[id]} className="docs-nav-icon" />
                {t(`sections.${id}`)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar toggle */}
        <button className="docs-mobile-toggle" onClick={() => setSidebarOpen(v => !v)}>
          <FontAwesomeIcon icon={faBars} /> {t('mobileMenu')}
        </button>

        {/* Content */}
        <main className="docs-content" id="main-content">

          {active === 'intro' && (
            <article className="doc-article">
              <h1>{t('intro.title')}</h1>
              <p className="doc-lead">{t('intro.lead')}</p>

              <h2>{t('intro.howTitle')}</h2>
              <p>{t('intro.howDesc')}</p>
              <ol className="doc-list">
                {t('intro.steps', { returnObjects: true }).map((s, i) => <li key={i}>{s}</li>)}
              </ol>

              <h2>{t('intro.archTitle')}</h2>
              <p>{t('intro.archDesc')}</p>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>{t('intro.archTable.colVar')}</th>
                      <th>{t('intro.archTable.colUnit')}</th>
                      <th>{t('intro.archTable.colRange')}</th>
                      <th>{t('intro.archTable.colDesc')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t('intro.archTable.rows', { returnObjects: true }).map(row => (
                      <tr key={row.var}>
                        <td><code>{row.var}</code></td>
                        <td>{row.unit}</td>
                        <td>{row.range}</td>
                        <td>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{t('intro.archOutputPre')} <code>XS</code>, <code>S</code>, <code>M</code>, <code>L</code>, <code>XL</code>, <code>XXL</code>.</p>
              <Callout type="info">
                <Trans i18nKey="docs:intro.callout" components={{ strong: <strong /> }} />
              </Callout>
            </article>
          )}

          {active === 'quickstart' && (
            <article className="doc-article">
              <h1>{t('quickstart.title')}</h1>
              <p className="doc-lead">{t('quickstart.lead')}</p>

              <h2>{t('quickstart.step1Title')}</h2>
              <p>
                <Trans i18nKey="docs:quickstart.step1" components={{ link: <Link to="/register" /> }} />
              </p>

              <h2>{t('quickstart.step2Title')}</h2>
              <p>{t('quickstart.step2')}</p>
              <Callout type="warning">
                <Trans i18nKey="docs:quickstart.step2Callout" components={{ strong: <strong /> }} />
              </Callout>

              <h2>{t('quickstart.step3Title')}</h2>
              <p>{t('quickstart.step3')}</p>
              <CodeBlock lang="HTML" code={`<link rel="stylesheet" href="https://cdn.usize.app/widget.css">

<div id="usize-widget"></div>

<script src="https://cdn.usize.app/widget.js"></script>
<script>
  USize.init({
    apiKey: "us_live_TU_API_KEY",
    container: "#usize-widget"
  });
</script>`} />
              <Callout type="success">{t('quickstart.step3Callout')}</Callout>

              <h2>{t('quickstart.verifyTitle')}</h2>
              <p>
                <Trans
                  i18nKey="docs:quickstart.verifyDesc"
                  components={{ code: <code /> }}
                />
              </p>
            </article>
          )}

          {active === 'training' && (
            <article className="doc-article">
              <h1>{t('training.title')}</h1>
              <p className="doc-lead">{t('training.lead')}</p>

              <h2>{t('training.formatTitle')}</h2>
              <p>{t('training.formatDesc')}</p>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>{t('training.formatTable.colCol')}</th>
                      <th>{t('training.formatTable.colVariants')}</th>
                      <th>{t('training.formatTable.colType')}</th>
                      <th>{t('training.formatTable.colRequired')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><code>espalda_cm</code></td><td>espalda</td><td>{t('training.formatTable.typeNumber')}</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>altura_cm</code></td><td>altura</td><td>{t('training.formatTable.typeNumber')}</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>peso_kg</code></td><td>peso</td><td>{t('training.formatTable.typeNumber')}</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>edad_años</code></td><td>edad</td><td>{t('training.formatTable.typeNumber')}</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>talla</code></td><td>Talla, TALLA</td><td>{t('training.formatTable.typeSize')}</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                  </tbody>
                </table>
              </div>

              <h2>{t('training.exampleTitle')}</h2>
              <CodeBlock lang="CSV" code={`espalda_cm,altura_cm,peso_kg,edad_años,talla
37,155,46,23,XS
41,163,56,25,S
45,168,64,31,M
48,174,78,32,L
52,178,88,35,XL
58,183,108,41,XXL`} />

              <Callout type="info">
                <Trans i18nKey="docs:training.callout" components={{ link: <Link to="/dashboard" /> }} />
              </Callout>

              <h2>{t('training.recsTitle')}</h2>
              <ul className="doc-list">
                {t('training.recs', { returnObjects: true }).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </article>
          )}

          {active === 'options' && (
            <article className="doc-article">
              <h1>{t('options.title')}</h1>
              <p className="doc-lead">{t('options.leadPre')} <code>USize.init()</code>.</p>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>{t('options.table.colOption')}</th>
                      <th>{t('options.table.colType')}</th>
                      <th>{t('options.table.colRequired')}</th>
                      <th>{t('options.table.colDesc')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><code>apiKey</code></td><td>string</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td><td>{t('options.table.descApiKey')}</td></tr>
                    <tr><td><code>container</code></td><td>string</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td><td>{t('options.table.descContainer')}</td></tr>
                    <tr><td><code>brandColor</code></td><td>string</td><td>—</td><td>{t('options.table.descBrandColor')}</td></tr>
                    <tr><td><code>buttonText</code></td><td>string</td><td>—</td><td>{t('options.table.descButtonText')}</td></tr>
                    <tr><td><code>position</code></td><td>string</td><td>—</td><td>{t('options.table.descPosition')}</td></tr>
                    <tr><td><code>locale</code></td><td>string</td><td>—</td><td>{t('options.table.descLocale')}</td></tr>
                  </tbody>
                </table>
              </div>
              <h2>{t('options.exampleTitle')}</h2>
              <CodeBlock lang="JS" code={`USize.init({
  apiKey: "us_live_••••••••",
  container: "#usize-widget",
  brandColor: "#e63946",
  buttonText: "Encontrar mi talla",
  position: "after-add-to-cart",
  locale: "es"
});`} />
            </article>
          )}

          {active === 'api' && (
            <article className="doc-article">
              <h1>{t('api.title')}</h1>
              <p className="doc-lead">
                {t('api.leadPre')} <code>USize</code> {t('api.leadPost')}
              </p>

              <h2><code>USize.init(config)</code></h2>
              <p>{t('api.initDesc')}</p>
              <CodeBlock lang="JS" code={`USize.init({ apiKey: "us_live_...", container: "#usize-widget" });`} />

              <h2><code>USize.predict(data)</code></h2>
              <p>{t('api.predictDesc')}</p>
              <CodeBlock lang="JS" code={`const result = await USize.predict({
  espalda: 44,   // cm
  altura: 170,   // cm
  peso: 68,      // kg
  edad: 29       // años
});
console.log(result); // { size: "M", confidence: 0.87 }`} />

              <h2><code>USize.on(event, callback)</code></h2>
              <p>{t('api.onDesc')}</p>
              <CodeBlock lang="JS" code={t('api.onCode')} />

              <Callout type="warning">{t('api.callout')}</Callout>
            </article>
          )}

          {active === 'integration' && (
            <article className="doc-article">
              <h1>{t('integration.title')}</h1>
              <p className="doc-lead">{t('integration.lead')}</p>

              <h2>{t('integration.shopifyTitle')}</h2>
              <p>
                <Trans
                  i18nKey="docs:integration.shopifyDesc"
                  components={{ code: <code /> }}
                />
              </p>
              <CodeBlock lang="Liquid" code={`{% comment %} USize widget {% endcomment %}
<link rel="stylesheet" href="https://cdn.usize.app/widget.css">
<div id="usize-widget"></div>
<script src="https://cdn.usize.app/widget.js"></script>
<script>
  USize.init({
    apiKey: "{{ shop.metafields.usize.api_key }}",
    container: "#usize-widget",
    brandColor: "{{ settings.color_accent }}"
  });
</script>`} />

              <h2>{t('integration.wooTitle')}</h2>
              <p>
                {t('integration.wooDescPre')} <strong>{t('integration.wooDescBold')}</strong> {t('integration.wooDescPost')}
              </p>
              <CodeBlock lang="PHP" code={`<?php
add_action('woocommerce_after_add_to_cart_button', 'usize_widget');
function usize_widget() { ?>
  <link rel="stylesheet" href="https://cdn.usize.app/widget.css">
  <div id="usize-widget"></div>
  <script src="https://cdn.usize.app/widget.js"></script>
  <script>
    USize.init({ apiKey: "TU_API_KEY", container: "#usize-widget" });
  </script>
<?php }`} />

              <h2>{t('integration.htmlTitle')}</h2>
              <p>{t('integration.htmlDesc')}</p>
              <CodeBlock lang="HTML" code={`<html>
  <head>
    <link rel="stylesheet" href="https://cdn.usize.app/widget.css">
  </head>
  <body>
    <div id="usize-widget"></div>
    <script src="https://cdn.usize.app/widget.js"></script>
    <script>
      USize.init({ apiKey: "TU_API_KEY", container: "#usize-widget" });
    </script>
  </body>
</html>`} />
            </article>
          )}

          {active === 'faq' && (
            <article className="doc-article" id="faq">
              <h1>{t('faq.title')}</h1>
              <p className="doc-lead">{t('faq.lead')}</p>

              <h2>{t('faq.q1')}</h2>
              <p>{t('faq.a1')}</p>

              <h2>{t('faq.q2')}</h2>
              <p>{t('faq.a2')}</p>

              <h2>{t('faq.q3')}</h2>
              <p>{t('faq.a3')}</p>

              <h2>{t('faq.q4')}</h2>
              <p>{t('faq.a4')}</p>

              <h2>{t('faq.q5')}</h2>
              <p>{t('faq.a5')}</p>

              <Callout type="info">
                <Trans
                  i18nKey="docs:faq.callout"
                  components={{ mail: <a href="mailto:soporte@usize.app">{/* content injected by Trans */}soporte@usize.app</a> }}
                />
              </Callout>
            </article>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}
