import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faBrain, faCode, faPalette,
  faCircleCheck, faCircleXmark, faSpinner,
  faDownload, faUpload, faPlay,
  faCopy, faRightFromBracket, faKey,
  faArrowTrendUp, faArrowTrendDown, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useModel } from '../../context/ModelContext';
import { DEFAULT_INPUT_DATA, DEFAULT_LABELS, trainModel, parseExcelRows } from '../../ml/modelConfig';
import './DashboardPage.css';

const SIZE_DIST = [
  { size: 'S',  pct: 18, color: 'var(--color-accent)' },
  { size: 'M',  pct: 35, color: '#7ab8fa' },
  { size: 'L',  pct: 29, color: '#5db35d' },
  { size: 'XL', pct: 18, color: '#ef7b7b' },
];

const NAV_ICONS = [faGauge, faBrain, faCode, faPalette];
const NAV_IDS   = ['overview', 'model', 'integration', 'customization'];

function downloadTemplate() {
  const rows = DEFAULT_INPUT_DATA.slice(0, 8).map((r, i) => ({
    espalda_cm: r[0], altura_cm: r[1], peso_kg: r[2], 'edad_años': r[3],
    talla: ['S','M','L','XL'][i % 4],
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 11 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos de tallas');
  XLSX.writeFile(wb, 'plantilla-usize.xlsx');
}

function StatCards() {
  const { t } = useTranslation('dashboard');
  const MOCK_STATS = [
    { key: 'predictions', value: '1 247', delta: '+12 %', up: true  },
    { key: 'accuracy',    value: '94.3 %', delta: '+1.2 %', up: true  },
    { key: 'users',       value: '89',     delta: '+8 %',  up: true  },
    { key: 'satisfaction',value: '4.7 / 5', delta: '-0.1', up: false },
  ];
  return (
    <div className="stats-grid">
      {MOCK_STATS.map(s => (
        <div key={s.key} className="stat-card">
          <p className="stat-label">{t(`stats.${s.key}`)}</p>
          <p className="stat-value">{s.value}</p>
          <span className={`stat-delta ${s.up ? 'up' : 'down'}`}>
            <FontAwesomeIcon icon={s.up ? faArrowTrendUp : faArrowTrendDown} />
            {s.delta} {t('stats.vsPrev')}
          </span>
        </div>
      ))}
    </div>
  );
}

function SizeDistChart() {
  const { t } = useTranslation('dashboard');
  return (
    <div className="dist-card">
      <h3 className="card-title">{t('dist.title')}</h3>
      <div className="dist-bars">
        {SIZE_DIST.map(({ size, pct, color }) => (
          <div key={size} className="dist-row">
            <span className="dist-size">{size}</span>
            <div className="dist-bar-track">
              <div className="dist-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="dist-pct">{pct} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelSection({ user }) {
  const { modelStatus, markDirty, markReady } = useModel();
  const { t } = useTranslation('dashboard');
  const [uploadedData, setUploadedData]   = useState(null);
  const [parseErrors, setParseErrors]     = useState([]);
  const [isTraining, setIsTraining]       = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainLogs, setTrainLogs]         = useState([]);
  const [isTrained, setIsTrained]         = useState(false);
  const [includeBase, setIncludeBase]     = useState(true);
  const fileRef   = useRef(null);
  const logEndRef = useRef(null);

  function addLog(type, text) {
    setTrainLogs(prev => [...prev, { type, text }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(data, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const { inputData, labels, errors } = parseExcelRows(rows);
    setParseErrors(errors);
    setUploadedData(inputData.length > 0 ? { inputData, labels } : null);
  }

  async function handleTrain() {
    if (!uploadedData) return;
    setIsTraining(true);
    setIsTrained(false);
    setTrainProgress(0);
    setTrainLogs([]);
    markDirty();

    const inputData = includeBase
      ? [...DEFAULT_INPUT_DATA, ...uploadedData.inputData]
      : uploadedData.inputData;
    const labels = includeBase
      ? [...DEFAULT_LABELS, ...uploadedData.labels]
      : uploadedData.labels;

    const EPOCHS = 201;
    addLog('info', t('model.logStart', { count: inputData.length }));

    try {
      const result = await trainModel({
        inputData, labels, epochs: EPOCHS,
        onEpoch: (epoch, { loss }) => {
          setTrainProgress(Math.round(((epoch + 1) / EPOCHS) * 100));
          if (epoch === 0) addLog('start', t('model.logTraining'));
          if (epoch % 50 === 0 && epoch > 0)
            addLog('epoch', t('model.logEpoch', { epoch, total: EPOCHS - 1, loss: loss.toFixed(6) }));
        },
      });

      const accKey = Object.keys(result.history).find(k => k.toLowerCase().includes('acc')) ?? 'acc';
      const h = result.history[accKey] ?? [];
      const acc = h.length ? Math.round(h[h.length - 1] * 10000) / 100 : 100;
      addLog('success', t('model.logComplete', { acc }));
      addLog('success', t('model.logSaved'));
      setIsTrained(true);
      markReady();
    } catch (err) {
      addLog('error', t('model.logError', { msg: err.message }));
    } finally {
      setIsTraining(false);
      setTrainProgress(100);
    }
  }

  function statusIcon() {
    if (modelStatus === 'ready')  return <FontAwesomeIcon icon={faCircleCheck} />;
    if (modelStatus === 'error')  return <FontAwesomeIcon icon={faCircleXmark} />;
    return <FontAwesomeIcon icon={faSpinner} spin />;
  }
  function statusLabel() {
    if (modelStatus === 'ready')        return t('model.statusReady');
    if (modelStatus === 'initializing') return t('model.statusInitializing');
    if (modelStatus === 'checking')     return t('model.statusChecking');
    return t('model.statusError');
  }

  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <h3 className="card-title">{t('model.statusTitle')}</h3>
          <div className={`model-status-badge ${modelStatus}`}>
            {statusIcon()} {statusLabel()}
          </div>
          <dl className="model-meta">
            <div><dt>{t('model.metaPlan')}</dt><dd>{user.plan}</dd></div>
            <div><dt>{t('model.metaBrand')}</dt><dd>{user.brand}</dd></div>
            <div><dt>{t('model.metaInputs')}</dt><dd>espalda · altura · peso · edad</dd></div>
            <div><dt>{t('model.metaArch')}</dt><dd>4 → 100 → 1000 → 100 → 4</dd></div>
          </dl>
        </div>

        <div className="dash-card flex-grow">
          <h3 className="card-title">{t('model.retrain')}</h3>
          <p className="card-desc">{t('model.retrainDesc')}</p>

          <div className="upload-actions">
            <button className="btn-outline" onClick={downloadTemplate}>
              <FontAwesomeIcon icon={faDownload} /> {t('model.downloadBtn')}
            </button>
            <button className="btn-outline" onClick={() => fileRef.current?.click()}>
              <FontAwesomeIcon icon={faUpload} /> {t('model.uploadBtn')}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>

          {uploadedData && (
            <div className="upload-summary success">
              <FontAwesomeIcon icon={faCircleCheck} /> {t('model.rowsLoaded', { count: uploadedData.inputData.length })}
            </div>
          )}
          {parseErrors.length > 0 && (
            <div className="upload-summary error">
              {parseErrors.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
              {parseErrors.length > 3 && <div>{t('model.moreErrors', { count: parseErrors.length - 3 })}</div>}
            </div>
          )}

          {uploadedData && (
            <label className="checkbox-label">
              <input type="checkbox" checked={includeBase}
                onChange={e => setIncludeBase(e.target.checked)} />
              {t('model.combineBase', { count: DEFAULT_INPUT_DATA.length })}
            </label>
          )}

          {uploadedData && (
            <button className="btn-primary-dash" onClick={handleTrain} disabled={isTraining}>
              {isTraining
                ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('model.training')}</>
                : <><FontAwesomeIcon icon={faPlay} /> {t('model.trainBtn')}</>
              }
            </button>
          )}

          {(isTraining || isTrained) && trainProgress > 0 && (
            <div className="progress-bar-wrap">
              <span className="progress-label">{trainProgress}%</span>
              <div className="progress-bar" style={{ width: `${trainProgress}%` }} />
            </div>
          )}

          {trainLogs.length > 0 && (
            <div className="training-log">
              {trainLogs.map((l, i) => (
                <div key={i} className={`log-entry log-entry--${l.type}`}>{l.text}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationSection({ user }) {
  const { t } = useTranslation('dashboard');
  const [copied, setCopied]       = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const snippet = `<!-- 1. Agrega en tu <head> -->
<link rel="stylesheet"
  href="https://cdn.usize.app/widget.css">

<!-- 2. Contenedor donde quieres el botón -->
<div id="usize-widget"></div>

<!-- 3. Inicializa el widget -->
<script src="https://cdn.usize.app/widget.js"></script>
<script>
  USize.init({
    apiKey: "${user.apiKey}",
    container: "#usize-widget"
  });
</script>`;

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function copyKey() {
    navigator.clipboard.writeText(user.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <h3 className="card-title">
            <FontAwesomeIcon icon={faKey} className="title-icon" /> {t('integration.apiKeyTitle')}
          </h3>
          <p className="card-desc">{t('integration.apiKeyDesc')}</p>
          <div className="api-key-box">
            <code>{user.apiKey}</code>
            <button className="btn-copy-inline" onClick={copyKey}>
              <FontAwesomeIcon icon={faCopy} /> {copiedKey ? t('integration.copied') : t('integration.copy')}
            </button>
          </div>
          <p className="card-hint">{t('integration.apiKeyHint')}</p>
        </div>

        <div className="dash-card flex-grow">
          <div className="code-card-header">
            <h3 className="card-title">{t('integration.snippetTitle')}</h3>
            <button className="btn-copy" onClick={copySnippet}>
              <FontAwesomeIcon icon={faCopy} /> {copied ? t('integration.copied') : t('integration.copyCode')}
            </button>
          </div>
          <pre className="code-pre"><code>{snippet}</code></pre>
        </div>
      </div>

      <div className="dash-card info-card">
        <h3 className="card-title">{t('integration.platformsTitle')}</h3>
        <div className="platforms-grid">
          {['Shopify', 'WooCommerce', 'Vtex', 'Magento', 'PrestaShop', 'HTML puro'].map(p => (
            <span key={p} className="platform-tag">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomizationSection() {
  const { t } = useTranslation('dashboard');
  const [color,  setColor]  = useState('#53a0f8');
  const [btnText, setBtnText] = useState('¿Cuál es mi talla?');

  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <h3 className="card-title">{t('customization.title')}</h3>

          <div className="custom-field">
            <label>{t('customization.colorLabel')}</label>
            <div className="color-row">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} />
              <code>{color}</code>
            </div>
          </div>

          <div className="custom-field">
            <label>{t('customization.btnLabel')}</label>
            <input type="text" className="text-input" value={btnText}
              onChange={e => setBtnText(e.target.value)} maxLength={60} />
          </div>

          <button className="btn-primary-dash" onClick={() => {}}>
            {t('customization.saveBtn')}
          </button>
        </div>

        <div className="dash-card">
          <h3 className="card-title">{t('customization.previewTitle')}</h3>
          <div className="preview-mockup">
            <div className="preview-product-img" />
            <div className="preview-info">
              <div className="preview-line w60" />
              <div className="preview-line w40" />
              <button className="preview-cta" style={{ background: color, borderColor: color }}>
                {btnText}
              </button>
            </div>
          </div>
          <p className="card-hint" style={{ marginTop: 12 }}>
            {t('customization.previewHint')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { t }            = useTranslation('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const activeLabel = t(`nav.${activeTab}`);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="sidebar-brand">
            <div className="brand-logo">
              <span className="brand-logo-letter">U</span>
            </div>
            <span className="sidebar-brand-name">USize</span>
          </Link>
          <nav className="sidebar-nav">
            {NAV_IDS.map((id, i) => (
              <button
                key={id}
                className={`sidebar-item${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <FontAwesomeIcon icon={NAV_ICONS[i]} className="sidebar-icon" />
                <span>{t(`nav.${id}`)}</span>
                {activeTab === id && (
                  <FontAwesomeIcon icon={faChevronRight} className="sidebar-active-arrow" />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{user.name[0].toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.name}</p>
              <p className="user-plan">{user.plan}</p>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} /> {t('logout')}
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-title">{activeLabel}</h1>
            <p className="dash-subtitle">
              {t('topbar.welcomePre')} <strong>{user.name}</strong>
            </p>
          </div>
        </div>

        <div className="dash-body">
          {activeTab === 'overview' && (
            <>
              <StatCards />
              <SizeDistChart />
            </>
          )}
          {activeTab === 'model'         && <ModelSection user={user} />}
          {activeTab === 'integration'   && <IntegrationSection user={user} />}
          {activeTab === 'customization' && <CustomizationSection />}
        </div>
      </main>
    </div>
  );
}
