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
import { useAuth } from '../../context/AuthContext';
import { useModel } from '../../context/ModelContext';
import { DEFAULT_INPUT_DATA, DEFAULT_LABELS, trainModel, parseExcelRows } from '../../ml/modelConfig';
import './DashboardPage.css';

const MOCK_STATS = [
  { label: 'Predicciones este mes', value: '1 247', delta: '+12 %', up: true  },
  { label: 'Accuracy del modelo',   value: '94.3 %', delta: '+1.2 %', up: true  },
  { label: 'Usuarios únicos',       value: '89',     delta: '+8 %',  up: true  },
  { label: 'Tasa de satisfacción',  value: '4.7 / 5', delta: '-0.1', up: false },
];

const SIZE_DIST = [
  { size: 'S',  pct: 18, color: 'var(--color-accent)' },
  { size: 'M',  pct: 35, color: '#7ab8fa' },
  { size: 'L',  pct: 29, color: '#5db35d' },
  { size: 'XL', pct: 18, color: '#ef7b7b' },
];

const NAV_ITEMS = [
  { id: 'overview',      icon: faGauge,   label: 'Resumen' },
  { id: 'model',         icon: faBrain,   label: 'Modelo IA' },
  { id: 'integration',   icon: faCode,    label: 'Integración' },
  { id: 'customization', icon: faPalette, label: 'Personalización' },
];

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
  return (
    <div className="stats-grid">
      {MOCK_STATS.map(s => (
        <div key={s.label} className="stat-card">
          <p className="stat-label">{s.label}</p>
          <p className="stat-value">{s.value}</p>
          <span className={`stat-delta ${s.up ? 'up' : 'down'}`}>
            <FontAwesomeIcon icon={s.up ? faArrowTrendUp : faArrowTrendDown} />
            {s.delta} vs mes anterior
          </span>
        </div>
      ))}
    </div>
  );
}

function SizeDistChart() {
  return (
    <div className="dist-card">
      <h3 className="card-title">Distribución de tallas predichas</h3>
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
  const [uploadedData, setUploadedData]   = useState(null);
  const [parseErrors, setParseErrors]     = useState([]);
  const [isTraining, setIsTraining]       = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainLogs, setTrainLogs]         = useState([]);
  const [isTrained, setIsTrained]         = useState(false);
  const [includeBase, setIncludeBase]     = useState(true);
  const fileRef  = useRef(null);
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
    addLog('info', `Iniciando entrenamiento con ${inputData.length} muestras…`);

    try {
      const result = await trainModel({
        inputData, labels, epochs: EPOCHS,
        onEpoch: (epoch, { loss }) => {
          setTrainProgress(Math.round(((epoch + 1) / EPOCHS) * 100));
          if (epoch === 0) addLog('start', 'Entrenando red neuronal…');
          if (epoch % 50 === 0 && epoch > 0)
            addLog('epoch', `Epoch ${epoch}/${EPOCHS - 1}  —  loss: ${loss.toFixed(6)}`);
        },
      });

      const accKey = Object.keys(result.history).find(k => k.toLowerCase().includes('acc')) ?? 'acc';
      const h = result.history[accKey] ?? [];
      const acc = h.length ? Math.round(h[h.length - 1] * 10000) / 100 : 100;
      addLog('success', `Entrenamiento completo — Accuracy: ${acc}%`);
      addLog('success', 'Modelo guardado en localStorage');
      setIsTrained(true);
      markReady();
    } catch (err) {
      addLog('error', `Error: ${err.message}`);
    } finally {
      setIsTraining(false);
      setTrainProgress(100);
    }
  }

  function statusIcon() {
    if (modelStatus === 'ready')        return <FontAwesomeIcon icon={faCircleCheck} />;
    if (modelStatus === 'error')        return <FontAwesomeIcon icon={faCircleXmark} />;
    return <FontAwesomeIcon icon={faSpinner} spin />;
  }
  function statusLabel() {
    if (modelStatus === 'ready')        return 'Modelo activo';
    if (modelStatus === 'initializing') return 'Inicializando…';
    if (modelStatus === 'checking')     return 'Verificando…';
    return 'Error';
  }

  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <h3 className="card-title">Estado del modelo</h3>
          <div className={`model-status-badge ${modelStatus}`}>
            {statusIcon()} {statusLabel()}
          </div>
          <dl className="model-meta">
            <div><dt>Plan</dt><dd>{user.plan}</dd></div>
            <div><dt>Marca</dt><dd>{user.brand}</dd></div>
            <div><dt>Entradas</dt><dd>espalda · altura · peso · edad</dd></div>
            <div><dt>Arquitectura</dt><dd>4 → 100 → 1000 → 100 → 4</dd></div>
          </dl>
        </div>

        <div className="dash-card flex-grow">
          <h3 className="card-title">Reentrenar con tus datos</h3>
          <p className="card-desc">
            Descarga la plantilla, rellénala con los datos de tu marca y cárgala
            para entrenar un modelo personalizado.
          </p>

          <div className="upload-actions">
            <button className="btn-outline" onClick={downloadTemplate}>
              <FontAwesomeIcon icon={faDownload} /> Descargar plantilla Excel
            </button>
            <button className="btn-outline" onClick={() => fileRef.current?.click()}>
              <FontAwesomeIcon icon={faUpload} /> Cargar Excel con datos
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>

          {uploadedData && (
            <div className="upload-summary success">
              <FontAwesomeIcon icon={faCircleCheck} /> {uploadedData.inputData.length} filas cargadas correctamente
            </div>
          )}
          {parseErrors.length > 0 && (
            <div className="upload-summary error">
              {parseErrors.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
              {parseErrors.length > 3 && <div>…y {parseErrors.length - 3} errores más</div>}
            </div>
          )}

          {uploadedData && (
            <label className="checkbox-label">
              <input type="checkbox" checked={includeBase}
                onChange={e => setIncludeBase(e.target.checked)} />
              Combinar con datos base ({DEFAULT_INPUT_DATA.length} muestras)
            </label>
          )}

          {uploadedData && (
            <button className="btn-primary-dash" onClick={handleTrain} disabled={isTraining}>
              {isTraining
                ? <><FontAwesomeIcon icon={faSpinner} spin /> Entrenando…</>
                : <><FontAwesomeIcon icon={faPlay} /> Iniciar entrenamiento</>
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
  const [copied, setCopied] = useState(false);
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
            <FontAwesomeIcon icon={faKey} className="title-icon" /> Tu API key
          </h3>
          <p className="card-desc">Úsala para autenticar el widget en tu tienda.</p>
          <div className="api-key-box">
            <code>{user.apiKey}</code>
            <button className="btn-copy-inline" onClick={copyKey}>
              <FontAwesomeIcon icon={faCopy} /> {copiedKey ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="card-hint">Mantén esta clave privada. No la expongas en código público.</p>
        </div>

        <div className="dash-card flex-grow">
          <div className="code-card-header">
            <h3 className="card-title">Snippet de integración</h3>
            <button className="btn-copy" onClick={copySnippet}>
              <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copiado' : 'Copiar código'}
            </button>
          </div>
          <pre className="code-pre"><code>{snippet}</code></pre>
        </div>
      </div>

      <div className="dash-card info-card">
        <h3 className="card-title">Plataformas compatibles</h3>
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
  const [color, setColor]       = useState('#53a0f8');
  const [btnText, setBtnText]   = useState('¿Cuál es mi talla?');
  const [position, setPosition] = useState('after-add-to-cart');

  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <h3 className="card-title">Configuración del widget</h3>

          <div className="custom-field">
            <label>Color principal de la marca</label>
            <div className="color-row">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} />
              <code>{color}</code>
            </div>
          </div>

          <div className="custom-field">
            <label>Texto del botón</label>
            <input type="text" className="text-input" value={btnText}
              onChange={e => setBtnText(e.target.value)} maxLength={60} />
          </div>

          <div className="custom-field">
            <label>Posición en la página</label>
            <select className="select-input" value={position} onChange={e => setPosition(e.target.value)}>
              <option value="after-add-to-cart">Después del botón "Agregar al carrito"</option>
              <option value="before-add-to-cart">Antes del botón "Agregar al carrito"</option>
              <option value="size-guide">Junto a la guía de tallas</option>
              <option value="floating">Botón flotante</option>
            </select>
          </div>

          <button className="btn-primary-dash" onClick={() => {}}>
            Guardar configuración
          </button>
        </div>

        <div className="dash-card">
          <h3 className="card-title">Vista previa</h3>
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
            Vista previa aproximada. Los estilos finales pueden variar según tu tienda.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

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
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`sidebar-item${activeTab === item.id ? ' active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
                <span>{item.label}</span>
                {activeTab === item.id && (
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
            <FontAwesomeIcon icon={faRightFromBracket} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-title">{NAV_ITEMS.find(i => i.id === activeTab)?.label}</h1>
            <p className="dash-subtitle">Bienvenido, <strong>{user.name}</strong></p>
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
