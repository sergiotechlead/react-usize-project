import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faBrain, faCode, faPalette,
  faCircleCheck, faCircleXmark, faSpinner,
  faDownload, faUpload, faPlay,
  faCopy, faRightFromBracket, faKey,
  faArrowTrendUp, faArrowTrendDown, faChevronRight, faPlus,
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useAuth, apiFetch } from '../../context/AuthContext';
import { useModel } from '../../context/ModelContext';
import { DEFAULT_INPUT_DATA, DEFAULT_LABELS, SIZE_LABELS, trainModel, parseExcelRows } from '../../ml/modelConfig';
import './DashboardPage.css';

const NAV_ICONS = [faGauge, faBrain, faCode, faPalette];
const NAV_IDS   = ['overview', 'model', 'integration', 'customization'];

function downloadTemplate() {
  const rows = DEFAULT_INPUT_DATA.slice(0, 12).map((r, i) => ({
    espalda_cm: r[0], altura_cm: r[1], peso_kg: r[2], 'edad_años': r[3],
    talla: SIZE_LABELS[i % SIZE_LABELS.length],
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 11 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos de tallas');
  XLSX.writeFile(wb, 'plantilla-usize.xlsx');
}

function StatCards() {
  const { t } = useTranslation('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch('/analytics/overview')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  const STAT_CARDS = stats
    ? [
        { key: 'predictions', value: String(stats.predictions_this_month), delta: '', up: true },
        { key: 'accuracy', value: stats.accuracy != null ? `${Math.round(stats.accuracy * 1000) / 10} %` : '—', delta: '', up: true },
        { key: 'users', value: String(stats.active_users), delta: '', up: true },
        { key: 'satisfaction', value: `${stats.satisfaction} / 5`, delta: '', up: true },
      ]
    : [
        { key: 'predictions', value: '—', delta: '', up: true },
        { key: 'accuracy', value: '—', delta: '', up: true },
        { key: 'users', value: '—', delta: '', up: true },
        { key: 'satisfaction', value: '—', delta: '', up: true },
      ];

  return (
    <div className="stats-grid">
      {STAT_CARDS.map(s => (
        <div key={s.key} className="stat-card">
          <p className="stat-label">{t(`stats.${s.key}`)}</p>
          <p className="stat-value">{s.value}</p>
          {s.delta && (
            <span className={`stat-delta ${s.up ? 'up' : 'down'}`}>
              <FontAwesomeIcon icon={s.up ? faArrowTrendUp : faArrowTrendDown} />
              {s.delta} {t('stats.vsPrev')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function SizeDistChart() {
  const { t } = useTranslation('dashboard');
  const [dist, setDist] = useState([]);
  const COLORS = { XS: '#c084fc', S: 'var(--color-accent)', M: '#7ab8fa', L: '#5db35d', XL: '#ef7b7b', XXL: '#f59e0b' };

  useEffect(() => {
    apiFetch('/predictions/distribution')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length > 0) setDist(data); })
      .catch(() => {});
  }, []);

  const display = dist.length > 0 ? dist : [
    { size: 'XS', pct: 5 }, { size: 'S', pct: 15 }, { size: 'M', pct: 30 },
    { size: 'L', pct: 25 }, { size: 'XL', pct: 17 }, { size: 'XXL', pct: 8 },
  ];

  return (
    <div className="dist-card">
      <h3 className="card-title">{t('dist.title')}</h3>
      <div className="dist-bars">
        {display.map(({ size, pct }) => (
          <div key={size} className="dist-row">
            <span className="dist-size">{size}</span>
            <div className="dist-bar-track">
              <div className="dist-bar-fill" style={{ width: `${pct}%`, background: COLORS[size] || '#888' }} />
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

  const [models, setModels]               = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);
  const [uploadedData, setUploadedData]   = useState(null);
  const [uploadedFile, setUploadedFile]   = useState(null);
  const [parseErrors, setParseErrors]     = useState([]);
  const [isTraining, setIsTraining]       = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainLogs, setTrainLogs]         = useState([]);
  const [isTrained, setIsTrained]         = useState(false);
  const [includeBase, setIncludeBase]     = useState(true);
  const fileRef   = useRef(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    apiFetch('/models')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setModels(data);
          if (data.length > 0 && !activeModelId) setActiveModelId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function ensureModel() {
    if (activeModelId) return activeModelId;
    const res = await apiFetch('/models', {
      method: 'POST',
      body: JSON.stringify({ name: `${user.brand || 'My Brand'} Model` }),
    });
    if (!res.ok) return null;
    const newModel = await res.json();
    setModels(prev => [newModel, ...prev]);
    setActiveModelId(newModel.id);
    return newModel.id;
  }

  function addLog(type, text) {
    setTrainLogs(prev => [...prev, { type, text }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
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
    const start  = Date.now();
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
      const durationSecs = Math.round((Date.now() - start) / 1000);

      addLog('success', t('model.logComplete', { acc }));
      addLog('success', t('model.logSaved'));
      setIsTrained(true);
      markReady();

      const modelId = await ensureModel();
      if (modelId && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('accuracy', String(acc / 100));
        formData.append('samples_count', String(inputData.length));
        formData.append('epochs', String(EPOCHS));
        formData.append('duration_seconds', String(durationSecs));
        await apiFetch(`/models/${modelId}/train`, {
          method: 'POST',
          headers: {},
          body: formData,
        });
        addLog('success', 'Training session recorded in backend.');
      }
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

  const activeModel = models.find(m => m.id === activeModelId);

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
            <div><dt>{t('model.metaBrand')}</dt><dd>{user.brand_name || user.brand || '—'}</dd></div>
            <div><dt>{t('model.metaInputs')}</dt><dd>espalda · altura · peso · edad</dd></div>
            <div><dt>{t('model.metaArch')}</dt><dd>{`4 → 100 → 1000 → 100 → ${SIZE_LABELS.length}`}</dd></div>
          </dl>
          {models.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                Active model
              </label>
              <select
                style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                value={activeModelId || ''}
                onChange={e => setActiveModelId(e.target.value)}
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
                ))}
              </select>
            </div>
          )}
          {activeModel && activeModel.accuracy && (
            <div style={{ marginTop: 8, fontSize: '0.8rem', opacity: 0.7 }}>
              Backend accuracy: {Math.round(activeModel.accuracy * 1000) / 10}%
              · {activeModel.samples_count} samples
            </div>
          )}
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
  const [apiKeys, setApiKeys]       = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey]         = useState(null);
  const [copied, setCopied]         = useState(false);
  const [copiedKey, setCopiedKey]   = useState(false);

  useEffect(() => {
    apiFetch('/api-keys')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setApiKeys(data); })
      .catch(() => {});
  }, []);

  const displayKey = newKey?.key || (apiKeys[0] ? `${apiKeys[0].key_prefix}••••••••••••` : user.apiKey || '—');

  const snippet = `<!-- 1. Agrega en tu <head> -->
<link rel="stylesheet"
  href="https://cdn.usize.app/widget.css">

<!-- 2. Contenedor donde quieres el botón -->
<div id="usize-widget"></div>

<!-- 3. Inicializa el widget -->
<script src="https://cdn.usize.app/widget.js"></script>
<script>
  USize.init({
    apiKey: "${displayKey}",
    container: "#usize-widget"
  });
</script>`;

  async function generateKey() {
    setGenerating(true);
    try {
      const res = await apiFetch('/api-keys', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data);
        setApiKeys(prev => [{ id: data.id, key_prefix: data.key_prefix, is_active: true, created_at: new Date().toISOString() }, ...prev]);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function revokeKey(id) {
    await apiFetch(`/api-keys/${id}`, { method: 'DELETE' });
    setApiKeys(prev => prev.filter(k => k.id !== id));
    if (newKey?.id === id) setNewKey(null);
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyKey() {
    const keyToCopy = newKey?.key || displayKey;
    navigator.clipboard.writeText(keyToCopy);
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

          {newKey && (
            <div className="upload-summary success" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
              New key generated! Save it now — it won&apos;t be shown again.
            </div>
          )}

          <div className="api-key-box">
            <code>{displayKey}</code>
            <button className="btn-copy-inline" onClick={copyKey}>
              <FontAwesomeIcon icon={faCopy} /> {copiedKey ? t('integration.copied') : t('integration.copy')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-outline" onClick={generateKey} disabled={generating} style={{ fontSize: '0.8rem' }}>
              {generating ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
              {' '}Generate key
            </button>
          </div>

          {apiKeys.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 4 }}>Your keys:</p>
              {apiKeys.map(k => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: 4 }}>
                  <code>{k.key_prefix}••••</code>
                  <button onClick={() => revokeKey(k.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger, #ef4444)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

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
