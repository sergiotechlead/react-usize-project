import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faBrain, faCode, faPalette,
  faCircleCheck, faCircleXmark, faSpinner,
  faDownload, faUpload, faPlay,
  faCopy, faRightFromBracket, faKey,
  faArrowTrendUp, faArrowTrendDown, faChevronRight, faPlus,
  faUsers, faPaperPlane, faTrash, faSliders, faXmark, faGripVertical, faPen, faCheck, faShirt,
  faTriangleExclamation, faCreditCard, faIdCard, faCrown, faUserPen, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import * as tf from '@tensorflow/tfjs';
import { useTranslation } from 'react-i18next';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy,
  sortableKeyboardCoordinates, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth, apiFetch } from '../../context/AuthContext';
import { DEFAULT_INPUT_DATA, DEFAULT_LABELS, SIZE_LABELS, trainModel, parseExcelRows, getModelStorageKey } from '../../ml/modelConfig';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePageTitle } from '../../hooks/usePageTitle';
import './DashboardPage.css';

const NAV_ICONS = [faGauge, faBrain, faCode, faPalette, faCreditCard, faIdCard];
const NAV_IDS   = ['overview', 'model', 'integration', 'customization', 'plan', 'profile'];

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
      <h2 className="card-title">{t('dist.title')}</h2>
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

function PerModelOverview() {
  const { t } = useTranslation('dashboard');
  const [models, setModels] = useState([]);
  const [distByModel, setDistByModel] = useState({}); // { [modelId]: [{size, count, pct}, ...] }
  const COLORS = { XS: '#c084fc', S: 'var(--color-accent)', M: '#7ab8fa', L: '#5db35d', XL: '#ef7b7b', XXL: '#f59e0b' };

  useEffect(() => {
    apiFetch('/models')
      .then(r => r.ok ? r.json() : [])
      .then(async (data) => {
        if (!Array.isArray(data)) return;
        setModels(data);
        const entries = await Promise.all(data.map(async (m) => {
          const res = await apiFetch(`/predictions/distribution?modelId=${m.id}`);
          return [m.id, res.ok ? await res.json() : []];
        }));
        setDistByModel(Object.fromEntries(entries));
      })
      .catch(() => {});
  }, []);

  if (models.length === 0) return null;

  return (
    <div className="model-overview-section">
      <h2 className="card-title">{t('overview.perModelTitle')}</h2>
      <div className="model-overview-grid">
        {models.map(m => (
          <div key={m.id} className="dash-card model-overview-card">
            <h3 className="card-title">{m.name}</h3>
            <span className={`model-status-badge ${m.status}`}>{m.status}</span>
            {m.accuracy != null && (
              <p className="card-hint">
                {t('model.backendAccuracyLabel')}: {Math.round(m.accuracy * 1000) / 10}%
              </p>
            )}
            <div className="dist-bars">
              {(distByModel[m.id] || []).map(({ size, pct }) => (
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
        ))}
      </div>
    </div>
  );
}

function ArchitectureDiagram({ isTraining, finalAccuracy, hiddenLayers, sizeLabels, compact = false }) {
  const { t } = useTranslation('dashboard');
  const layerLabel = { input: t('model.archInput'), dense: t('model.archDense'), output: t('model.archOutput') };

  const layers = [
    { key: 'input', units: 4 },
    ...hiddenLayers.map(units => ({ key: 'dense', units })),
    { key: 'output', units: sizeLabels.length },
  ];

  return (
    <div className={`arch-diagram${compact ? ' arch-diagram--compact' : ''}`} role="img" aria-label={t('model.archTitle')}>
      {layers.map((layer, i) => (
        <div className="arch-layer" key={i}>
          <div className="arch-node">
            <span className="arch-node-units">{layer.units}</span>
            <span className="arch-node-label">{layerLabel[layer.key]}</span>
            {i === layers.length - 1 && finalAccuracy != null && (
              <span className="arch-node-accuracy">{finalAccuracy}%</span>
            )}
          </div>
          {i < layers.length - 1 && (
            <div className={`arch-connector${isTraining ? ' arch-connector--active' : ''}`}>
              <span className="arch-connector-dot" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const MIN_LAYERS = 1, MAX_LAYERS = 5;
const MIN_UNITS = 8, MAX_UNITS = 2048;
const MIN_LABELS = 2, MAX_LABELS = 12;
const MAX_LABEL_LEN = 20;
const DEFAULT_ARCHITECTURE = [100, 1000, 100];
const PRESETS = {
  balanced: DEFAULT_ARCHITECTURE,
};

function presetForArchitecture(arch) {
  if (JSON.stringify(arch) === JSON.stringify(PRESETS.balanced)) return 'balanced';
  return 'advanced';
}

function SizeLabelChip({ label, onRemove, removeDisabled, removeAriaLabel, dragAriaLabel }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: label });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <span className="size-label-chip size-label-chip--draggable" ref={setNodeRef} style={style}>
      <button
        type="button" className="size-label-chip-drag-handle"
        {...attributes} {...listeners} aria-label={dragAriaLabel}
      >
        <FontAwesomeIcon icon={faGripVertical} />
      </button>
      {label}
      <button
        type="button" onClick={onRemove}
        disabled={removeDisabled}
        aria-label={removeAriaLabel}
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </span>
  );
}

function ArchitectureModal({ model, onClose, onSave }) {
  const { t } = useTranslation('dashboard');
  const overlayRef = useRef(null);
  const cardRef = useRef(null);

  const initialArch = model?.architecture ?? DEFAULT_ARCHITECTURE;
  const initialLabels = model?.size_labels ?? SIZE_LABELS;

  const [preset, setPreset] = useState(presetForArchitecture(initialArch));
  const [layers, setLayers] = useState(initialArch);
  const [labels, setLabels] = useState(initialLabels);
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useFocusTrap(cardRef, true);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  function selectPreset(name) {
    setPreset(name);
    if (name === 'balanced') setLayers(PRESETS.balanced);
    // 'advanced' keeps whatever `layers` currently holds, made editable below
  }

  function updateLayerUnits(i, value) {
    const units = Math.min(MAX_UNITS, Math.max(MIN_UNITS, parseInt(value, 10) || MIN_UNITS));
    setLayers(prev => prev.map((u, idx) => (idx === i ? units : u)));
  }

  function addLayer() {
    if (layers.length >= MAX_LAYERS) return;
    setLayers(prev => [...prev, 100]);
  }

  function removeLayer(i) {
    if (layers.length <= MIN_LAYERS) return;
    setLayers(prev => prev.filter((_, idx) => idx !== i));
  }

  function addLabel() {
    const trimmed = newLabel.trim().toUpperCase().slice(0, MAX_LABEL_LEN);
    if (!trimmed || labels.length >= MAX_LABELS || labels.includes(trimmed)) return;
    setLabels(prev => [...prev, trimmed]);
    setNewLabel('');
  }

  function removeLabel(i) {
    if (labels.length <= MIN_LABELS) return;
    setLabels(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleLabelDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = labels.indexOf(active.id);
    const newIndex = labels.indexOf(over.id);
    setLabels(prev => arrayMove(prev, oldIndex, newIndex));
  }

  async function handleSave() {
    setError(null);
    if (layers.length < MIN_LAYERS || layers.length > MAX_LAYERS) {
      setError(t('model.archModalTitle'));
      return;
    }
    if (labels.length < MIN_LABELS || labels.length > MAX_LABELS) {
      return;
    }
    setSaving(true);
    try {
      await onSave(layers, labels);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
    >
      <div
        className="modal-card modal-card--wide"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="arch-modal-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="arch-modal-title">{t('model.archModalTitle')}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label={t('model.cancelBtn')}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="modal-body arch-modal-body">
          <div className="arch-preset-group">
            <label className={`arch-preset-option${preset === 'balanced' ? ' active' : ''}`}>
              <input type="radio" name="arch-preset" checked={preset === 'balanced'} onChange={() => selectPreset('balanced')} />
              {t('model.presetBalanced')}
            </label>
            <label className={`arch-preset-option${preset === 'advanced' ? ' active' : ''}`}>
              <input type="radio" name="arch-preset" checked={preset === 'advanced'} onChange={() => selectPreset('advanced')} />
              {t('model.presetAdvanced')}
            </label>
          </div>

          {preset === 'advanced' && (
            <div className="arch-layer-editor">
              {layers.map((units, i) => (
                <div className="arch-layer-row" key={i}>
                  <div className="arch-layer-slider-group">
                    <div className="arch-layer-slider-header">
                      <label htmlFor={`arch-layer-slider-${i}`}>{t('model.unitsLabel')} {i + 1}</label>
                      <span className="arch-layer-value">{units}</span>
                    </div>
                    <input
                      id={`arch-layer-slider-${i}`}
                      type="range" className="arch-layer-slider"
                      min={MIN_UNITS} max={MAX_UNITS} step={8} value={units}
                      onChange={e => updateLayerUnits(i, e.target.value)}
                    />
                  </div>
                  <button
                    type="button" className="btn-outline arch-layer-remove-btn"
                    onClick={() => removeLayer(i)} disabled={layers.length <= MIN_LAYERS}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
              <button
                type="button" className="btn-outline"
                onClick={addLayer} disabled={layers.length >= MAX_LAYERS}
              >
                <FontAwesomeIcon icon={faPlus} /> {t('model.addLayerBtn')}
              </button>
            </div>
          )}

          <h3 className="arch-title">{t('model.sizeLabelsTitle')}</h3>
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
            )}
            collisionDetection={closestCenter}
            onDragEnd={handleLabelDragEnd}
          >
            <SortableContext items={labels} strategy={horizontalListSortingStrategy}>
              <div className="size-label-chips">
                {labels.map((label, i) => (
                  <SizeLabelChip
                    key={label}
                    label={label}
                    onRemove={() => removeLabel(i)}
                    removeDisabled={labels.length <= MIN_LABELS}
                    removeAriaLabel={t('model.removeLayerBtn')}
                    dragAriaLabel={t('model.dragHandleLabel')}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="size-label-add-row">
            <input
              type="text" className="text-input"
              value={newLabel} maxLength={MAX_LABEL_LEN}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
              aria-label={t('model.newLabelInputLabel')}
            />
            <button type="button" className="btn-outline" onClick={addLabel} disabled={labels.length >= MAX_LABELS}>
              <FontAwesomeIcon icon={faPlus} /> {t('model.addLabelBtn')}
            </button>
          </div>

          {error && <div className="upload-summary error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>{t('model.cancelBtn')}</button>
            <button type="button" className="btn-primary-dash" onClick={handleSave} disabled={saving}>
              {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : t('model.saveBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveAccuracyChart({ data, epochsTotal, title, caption }) {
  if (!data || data.length < 2) return null;
  const w = 200, h = 60;
  const denom = Math.max(epochsTotal - 1, 1);
  const linePoints = data
    .map(d => `${(d.epoch / denom) * w},${h - d.acc * h}`)
    .join(' ');
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <div className="live-chart">
      <p className="live-chart-title">{title}</p>
      {/* Decorative — the same data point this line/area chart traces is
          already given as text in .live-chart-caption below, which is the
          real WCAG 1.1.1 text alternative for screen reader users. */}
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="live-chart-svg" aria-hidden="true">
        <polygon points={areaPoints} className="live-chart-area" />
        <polyline points={linePoints} className="live-chart-line" />
      </svg>
      {caption && <p className="live-chart-caption">{caption}</p>}
    </div>
  );
}

function ModelCard({ model, isActive, onSelect, onConfigure, onDelete, onRename }) {
  const { t } = useTranslation('dashboard');
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: model.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const architecture = model.architecture ?? [100, 1000, 100];
  const sizeLabels = model.size_labels ?? SIZE_LABELS;

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(model.name);

  function startRename(e) {
    e.stopPropagation();
    setNameDraft(model.name);
    setIsRenaming(true);
  }

  function commitRename() {
    setIsRenaming(false);
    onRename(nameDraft);
  }

  function cancelRename(e) {
    e.stopPropagation();
    setNameDraft(model.name);
    setIsRenaming(false);
  }

  function handleCardKeyDown(e) {
    // Mirrors onClick for keyboard users — the card acts as a single-select
    // "choose this model" control (see aria-pressed below), but it also
    // contains real nested <button>s (drag handle, rename, configure,
    // delete), so it can't be a native <button> itself. role="button" +
    // tabIndex + this handler gives it the same Enter/Space activation a
    // real button would have (WCAG 2.1.1 Keyboard) without nesting
    // interactive elements inside a native button.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`model-card${isActive ? ' model-card--active' : ''}`}
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
    >
      <div className="model-card-row">
        <button
          className="model-card-drag-handle" {...attributes} {...listeners}
          onClick={e => e.stopPropagation()} aria-label={t('model.dragHandleLabel')}
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </button>
        <div className="model-card-body">
          {isRenaming ? (
            <div className="model-card-rename-row" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                className="text-input model-card-rename-input"
                value={nameDraft}
                maxLength={120}
                autoFocus
                aria-label={t('model.renameInputLabel')}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename(e);
                }}
              />
              <button className="model-card-rename-confirm" onClick={commitRename} aria-label={t('model.saveBtn')}>
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button className="model-card-rename-cancel" onClick={cancelRename} aria-label={t('model.cancelBtn')}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ) : (
            <span className="model-card-name">
              {model.name}
              <button className="model-card-rename-btn" onClick={startRename} aria-label={t('model.renameBtn')}>
                <FontAwesomeIcon icon={faPen} />
              </button>
            </span>
          )}
          <span className={`model-status-badge ${model.status}`}>{model.status}</span>
          <span className="model-card-meta">
            {architecture.length} {t('model.layersLabel')} · {sizeLabels.length} {t('model.classesLabel')}
          </span>
        </div>
        <div className="model-card-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-outline" onClick={onConfigure}><FontAwesomeIcon icon={faSliders} /> {t('model.configureBtn')}</button>
          <button className="model-delete-btn" onClick={onDelete}><FontAwesomeIcon icon={faTrash} /> {t('model.deleteBtn')}</button>
        </div>
      </div>
      <ArchitectureDiagram
        isTraining={false}
        finalAccuracy={model.accuracy != null ? Math.round(model.accuracy * 1000) / 10 : null}
        hiddenLayers={architecture}
        sizeLabels={sizeLabels}
        compact
      />
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const titleId = 'confirm-modal-title';
  const messageId = 'confirm-modal-message';

  useFocusTrap(cardRef, true);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop"
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onCancel()}
    >
      <div
        className="modal-card confirm-modal-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : message}
        aria-describedby={title ? messageId : undefined}
        tabIndex={-1}
      >
        <div className={`confirm-modal-icon${danger ? ' confirm-modal-icon--danger' : ''}`}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
        </div>
        {title && <h2 className="modal-title confirm-modal-title" id={titleId}>{title}</h2>}
        <p className="confirm-modal-message" id={messageId}>{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn-outline" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'btn-danger-solid' : 'btn-primary-dash'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const EPOCHS = 201;

function ModelSection({ user }) {
  const { t } = useTranslation('dashboard');

  const [models, setModels]               = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);
  const [maxModels, setMaxModels]         = useState(null); // -1 = unlimited, null = not loaded yet
  const [creatingModel, setCreatingModel] = useState(false);
  const [modelActionError, setModelActionError] = useState(null);
  const [localModelState, setLocalModelState] = useState('checking'); // checking | untrained | ready | error
  const [uploadedData, setUploadedData]   = useState(null);
  const [uploadedFile, setUploadedFile]   = useState(null);
  const [parseErrors, setParseErrors]     = useState([]);
  const [isTraining, setIsTraining]       = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainLogs, setTrainLogs]         = useState([]);
  const [isTrained, setIsTrained]         = useState(false);
  const [includeBase, setIncludeBase]     = useState(true);
  const [epochChart, setEpochChart]       = useState([]);
  const [finalAccuracy, setFinalAccuracy] = useState(null);
  const [archModalOpen, setArchModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, confirmLabel, danger, run }
  const fileRef   = useRef(null);
  const logEndRef = useRef(null);

  const modelDndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    // Intentionally runs once on mount to seed the initial model list;
    // activeModelId is read only to avoid clobbering a value set elsewhere.
    apiFetch('/models')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setModels(data);
          if (data.length > 0 && !activeModelId) setActiveModelId(data[0].id);
        }
      })
      .catch(() => {});

    apiFetch('/subscriptions/current')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.plan) {
          setMaxModels(typeof data.plan.max_models === 'number' ? data.plan.max_models : -1);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Independent of the app-wide useModel() context: this checks whether THIS
  // specific model has locally-trained TF.js weights in THIS browser, reset
  // every time the selected model changes so no stale run bleeds through.
  useEffect(() => {
    let cancelled = false;
    setLocalModelState('checking');
    setEpochChart([]);
    setFinalAccuracy(null);
    setTrainProgress(0);
    setTrainLogs([]);
    setIsTrained(false);
    setModelActionError(null);

    if (!activeModelId) {
      setLocalModelState('untrained');
      return undefined;
    }
    tf.loadLayersModel(getModelStorageKey(activeModelId))
      .then(() => { if (!cancelled) setLocalModelState('ready'); })
      .catch(() => { if (!cancelled) setLocalModelState('untrained'); });

    return () => { cancelled = true; };
  }, [activeModelId]);

  const atLimit = maxModels != null && maxModels !== -1 && models.length >= maxModels;
  const activeModel = models.find(m => m.id === activeModelId);
  const effectiveArchitecture = activeModel?.architecture ?? [100, 1000, 100];
  const effectiveSizeLabels = activeModel?.size_labels ?? SIZE_LABELS;
  const combineBaseDisabled = JSON.stringify(effectiveSizeLabels) !== JSON.stringify(SIZE_LABELS);

  async function performDeleteModel(modelId) {
    await apiFetch(`/models/${modelId}`, { method: 'DELETE' });
    await tf.io.removeModel(getModelStorageKey(modelId)).catch(() => {});
    setModels(prev => {
      const next = prev.filter(m => m.id !== modelId);
      if (modelId === activeModelId) setActiveModelId(next.length > 0 ? next[0].id : null);
      return next;
    });
    setConfirmAction(null);
  }

  function handleDeleteModel(modelId = activeModelId) {
    if (!modelId) return;
    setConfirmAction({
      title: t('model.deleteConfirmTitle'),
      message: t('model.deleteConfirm'),
      confirmLabel: t('model.deleteBtn'),
      danger: true,
      run: () => performDeleteModel(modelId),
    });
  }

  async function performSaveArchitecture(newArch, newLabels, modelId, wasTrained) {
    const res = await apiFetch(`/models/${modelId}`, {
      method: 'PATCH',
      body: JSON.stringify({ architecture: newArch, size_labels: newLabels }),
    });
    if (res.ok) {
      const updated = await res.json();
      setModels(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      if (wasTrained) {
        await tf.io.removeModel(getModelStorageKey(modelId)).catch(() => {});
        setLocalModelState('untrained');
        setFinalAccuracy(null);
        setEpochChart([]);
      }
      setArchModalOpen(false);
    } else {
      const body = await res.json().catch(() => ({}));
      setModelActionError(body.message || t('model.createErrorFallback'));
    }
    setConfirmAction(null);
  }

  function handleSaveArchitecture(newArch, newLabels, modelId = activeModelId) {
    setModelActionError(null);
    const targetModel = models.find(m => m.id === modelId);
    const wasTrained = targetModel?.status && targetModel.status !== 'untrained';
    if (wasTrained) {
      setConfirmAction({
        title: t('model.archChangeConfirmTitle'),
        message: t('model.archChangeConfirm'),
        confirmLabel: t('model.archChangeConfirmBtn'),
        danger: false,
        run: () => performSaveArchitecture(newArch, newLabels, modelId, true),
      });
      return;
    }
    performSaveArchitecture(newArch, newLabels, modelId, false);
  }

  async function handleRenameModel(modelId, newName) {
    const trimmed = newName.trim();
    const target = models.find(m => m.id === modelId);
    if (!trimmed || !target || trimmed === target.name) return;
    const res = await apiFetch(`/models/${modelId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setModels(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    } else {
      const body = await res.json().catch(() => ({}));
      setModelActionError(body.message || t('model.createErrorFallback'));
    }
  }

  async function handleModelDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = models.findIndex(m => m.id === active.id);
    const newIndex = models.findIndex(m => m.id === over.id);
    const reordered = arrayMove(models, oldIndex, newIndex);
    setModels(reordered); // optimistic
    const res = await apiFetch('/models/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ modelIds: reordered.map(m => m.id) }),
    });
    if (!res.ok) {
      setModels(models); // revert to pre-drag order
      setModelActionError(t('model.reorderError'));
    }
  }

  async function createNewModel() {
    setModelActionError(null);
    setCreatingModel(true);
    try {
      const res = await apiFetch('/models', {
        method: 'POST',
        body: JSON.stringify({ name: `Model ${models.length + 1}` }),
      });
      if (res.ok) {
        const newModel = await res.json();
        setModels(prev => [newModel, ...prev]);
        setActiveModelId(newModel.id);
      } else {
        const body = await res.json().catch(() => ({}));
        setModelActionError(body.message || t('model.createErrorFallback'));
      }
    } catch {
      setModelActionError(t('model.createErrorFallback'));
    } finally {
      setCreatingModel(false);
    }
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
    if (!uploadedData || !activeModelId) return;
    setIsTraining(true);
    setIsTrained(false);
    setTrainProgress(0);
    setTrainLogs([]);
    setEpochChart([]);
    setFinalAccuracy(null);

    const useBase = includeBase && !combineBaseDisabled;
    const inputData = useBase
      ? [...DEFAULT_INPUT_DATA, ...uploadedData.inputData]
      : uploadedData.inputData;
    const labels = useBase
      ? [...DEFAULT_LABELS, ...uploadedData.labels]
      : uploadedData.labels;

    const start  = Date.now();
    addLog('info', t('model.logStart', { count: inputData.length }));

    try {
      const result = await trainModel({
        inputData, labels, epochs: EPOCHS, modelId: activeModelId,
        hiddenLayers: effectiveArchitecture, sizeLabels: effectiveSizeLabels,
        onEpoch: (epoch, logs) => {
          setTrainProgress(Math.round(((epoch + 1) / EPOCHS) * 100));
          const accKey = Object.keys(logs).find(k => k.toLowerCase().includes('acc'));
          const acc = accKey ? logs[accKey] : null;
          if (acc != null) {
            setEpochChart(prev => [...prev, { epoch, loss: logs.loss, acc }]);
          }
          if (epoch === 0) addLog('start', t('model.logTraining'));
          if (epoch % 50 === 0 && epoch > 0)
            addLog('epoch', t('model.logEpoch', { epoch, total: EPOCHS - 1, loss: logs.loss.toFixed(6) }));
        },
      });

      const accKey = Object.keys(result.history).find(k => k.toLowerCase().includes('acc')) ?? 'acc';
      const h = result.history[accKey] ?? [];
      const acc = h.length ? Math.round(h[h.length - 1] * 10000) / 100 : 100;
      const durationSecs = Math.round((Date.now() - start) / 1000);

      addLog('success', t('model.logComplete', { acc }));
      addLog('success', t('model.logSaved'));
      setIsTrained(true);
      setFinalAccuracy(acc);
      setLocalModelState('ready');

      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('accuracy', String(acc / 100));
        formData.append('samples_count', String(inputData.length));
        formData.append('epochs', String(EPOCHS));
        formData.append('duration_seconds', String(durationSecs));
        await apiFetch(`/models/${activeModelId}/train`, {
          method: 'POST',
          headers: {},
          body: formData,
        });
        addLog('success', t('model.logRecorded'));
        setModels(prev => prev.map(m => (
          m.id === activeModelId
            ? { ...m, status: 'ready', accuracy: acc / 100, samples_count: inputData.length }
            : m
        )));

        try {
          const trainedModel = await tf.loadLayersModel(getModelStorageKey(activeModelId));
          const tokens = JSON.parse(sessionStorage.getItem('usize_tokens') || 'null');
          await trainedModel.save(tf.io.http(`/api/v1/models/${activeModelId}/weights`, {
            requestInit: {
              headers: tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {},
            },
          }));
          addLog('success', t('model.logHosted'));
        } catch {
          addLog('info', t('model.logHostFailed'));
        }
      }
    } catch (err) {
      addLog('error', t('model.logError', { msg: err.message }));
      setLocalModelState('error');
    } finally {
      setIsTraining(false);
      setTrainProgress(100);
    }
  }

  function statusIcon() {
    if (localModelState === 'ready')     return <FontAwesomeIcon icon={faCircleCheck} />;
    if (localModelState === 'error')     return <FontAwesomeIcon icon={faCircleXmark} />;
    if (localModelState === 'untrained') return <FontAwesomeIcon icon={faCircleXmark} />;
    return <FontAwesomeIcon icon={faSpinner} spin />;
  }
  function statusLabel() {
    if (localModelState === 'ready')     return t('model.statusReady');
    if (localModelState === 'untrained') return t('model.statusUntrained');
    if (localModelState === 'checking')  return t('model.statusChecking');
    return t('model.statusError');
  }

  const lastEpochPoint = epochChart[epochChart.length - 1];

  return (
    <div className="section-content">
      <div className="cards-row">
        <div className="dash-card">
          <h2 className="card-title">{t('model.statusTitle')}</h2>
          <div className={`model-status-badge ${localModelState}`}>
            {statusIcon()} {statusLabel()}
          </div>
          <dl className="model-meta">
            <div><dt>{t('model.metaPlan')}</dt><dd>{user.plan}</dd></div>
            <div><dt>{t('model.metaBrand')}</dt><dd>{user.brand_name || user.brand || '—'}</dd></div>
            <div><dt>{t('model.metaInputs')}</dt><dd>espalda · altura · peso · edad</dd></div>
          </dl>

          <div className="model-list-header">
            <span className="model-list-label">
              {t('model.activeModelLabel')}
            </span>
            {maxModels != null && (
              <span className="model-count-badge">
                {t('model.modelsCount', {
                  count: models.length,
                  max: maxModels === -1 ? t('model.modelsUnlimited') : maxModels,
                })}
              </span>
            )}
          </div>

          {models.length > 0 ? (
            <DndContext
              sensors={modelDndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleModelDragEnd}
            >
              <SortableContext items={models.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="model-card-grid">
                  {models.map(m => (
                    <ModelCard
                      key={m.id}
                      model={m}
                      isActive={m.id === activeModelId}
                      onSelect={() => setActiveModelId(m.id)}
                      onConfigure={() => { setActiveModelId(m.id); setArchModalOpen(true); }}
                      onDelete={() => handleDeleteModel(m.id)}
                      onRename={(newName) => handleRenameModel(m.id, newName)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="card-hint">{t('model.noModelsYet')}</p>
          )}

          <div className="model-actions-row">
            <button
              className="btn-outline model-new-btn"
              onClick={createNewModel}
              disabled={atLimit || creatingModel}
              title={atLimit ? t('model.limitReachedHint') : undefined}
            >
              {creatingModel
                ? <FontAwesomeIcon icon={faSpinner} spin />
                : <FontAwesomeIcon icon={faPlus} />
              } {t('model.newModelBtn')}
            </button>
          </div>

          {atLimit && (
            <p className="upload-summary error model-limit-msg" role="alert">
              {t('model.limitReached')}{' '}
              <Link to="/pricing">{t('model.limitReachedHint')}</Link>
            </p>
          )}
          {modelActionError && (
            <p className="upload-summary error" role="alert">{modelActionError}</p>
          )}

          {activeModel && activeModel.accuracy != null && (
            <div className="model-backend-accuracy">
              {t('model.backendAccuracyLabel')}: {Math.round(activeModel.accuracy * 1000) / 10}%
              · {activeModel.samples_count} {t('model.samplesLabel')}
            </div>
          )}

          {localModelState === 'untrained' && activeModelId && (
            <p
              className="upload-summary"
              role="status"
              style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', color: '#f59e0b' }}
            >
              {t('model.untrainedLocal')}
            </p>
          )}

          <h3 className="arch-title">{t('model.archTitle')}</h3>
          <ArchitectureDiagram
            isTraining={isTraining}
            finalAccuracy={finalAccuracy}
            hiddenLayers={effectiveArchitecture}
            sizeLabels={effectiveSizeLabels}
          />
        </div>

        <div className="dash-card flex-grow">
          <h2 className="card-title">{t('model.retrain')}</h2>
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
            <div className="upload-summary success" role="status" aria-live="polite">
              <FontAwesomeIcon icon={faCircleCheck} /> {t('model.rowsLoaded', { count: uploadedData.inputData.length })}
            </div>
          )}
          {parseErrors.length > 0 && (
            <div className="upload-summary error" role="alert">
              {parseErrors.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
              {parseErrors.length > 3 && <div>{t('model.moreErrors', { count: parseErrors.length - 3 })}</div>}
            </div>
          )}

          {uploadedData && (
            <>
              <label className="checkbox-label">
                <input type="checkbox" checked={includeBase && !combineBaseDisabled}
                  disabled={combineBaseDisabled}
                  onChange={e => setIncludeBase(e.target.checked)} />
                {t('model.combineBase', { count: DEFAULT_INPUT_DATA.length })}
              </label>
              {combineBaseDisabled && (
                <p className="card-hint">{t('model.combineBaseDisabledHint')}</p>
              )}
            </>
          )}

          {uploadedData && !activeModelId && (
            <div className="upload-summary error" role="alert">{t('model.selectModelFirst')}</div>
          )}

          {uploadedData && (
            <button className="btn-primary-dash" onClick={handleTrain} disabled={isTraining || !activeModelId}>
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

          <LiveAccuracyChart
            data={epochChart}
            epochsTotal={EPOCHS}
            title={t('model.liveChartTitle')}
            caption={lastEpochPoint ? t('model.liveEpoch', {
              epoch: lastEpochPoint.epoch + 1,
              total: EPOCHS,
              acc: Math.round(lastEpochPoint.acc * 100),
            }) : null}
          />

          {trainLogs.length > 0 && (
            <div className="training-log" role="log" aria-live="polite">
              {trainLogs.map((l, i) => (
                <div key={i} className={`log-entry log-entry--${l.type}`}>{l.text}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>

      {archModalOpen && (
        <ArchitectureModal
          model={activeModel}
          onClose={() => setArchModalOpen(false)}
          onSave={handleSaveArchitecture}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          cancelLabel={t('model.cancelBtn')}
          danger={confirmAction.danger}
          onConfirm={confirmAction.run}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function IntegrationSection({ user }) {
  const { t } = useTranslation('dashboard');
  const [apiKeys, setApiKeys]       = useState([]);
  const [models, setModels]         = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey]         = useState(null);
  const [copied, setCopied]         = useState(false);
  const [copiedKey, setCopiedKey]   = useState(false);

  useEffect(() => {
    apiFetch('/api-keys')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setApiKeys(data); })
      .catch(() => {});

    apiFetch('/models')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setModels(data); })
      .catch(() => {});
  }, []);

  async function handleAssignModel(keyId, modelId) {
    const res = await apiFetch(`/api-keys/${keyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ model_id: modelId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApiKeys(prev => prev.map(k => (k.id === updated.id ? updated : k)));
    }
  }

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
        setApiKeys(prev => [{
          id: data.id, key_prefix: data.key_prefix, is_active: true, created_at: new Date().toISOString(),
          model_id: data.model_id ?? null, brand_color: data.brand_color ?? null, button_text: data.button_text ?? null,
        }, ...prev]);
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
          <h2 className="card-title">
            <FontAwesomeIcon icon={faKey} className="title-icon" /> {t('integration.apiKeyTitle')}
          </h2>
          <p className="card-desc">{t('integration.apiKeyDesc')}</p>

          {newKey && (
            <div className="upload-summary success" role="status" aria-live="polite" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
              New key generated! Save it now — it won&apos;t be shown again.
            </div>
          )}

          <div className="api-key-box">
            <code>{displayKey}</code>
            <button className="btn-copy-inline" onClick={copyKey} aria-live="polite">
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
                <div key={k.id} className="api-key-row-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <code>{k.key_prefix}••••</code>
                    <button onClick={() => revokeKey(k.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger, #ef4444)', cursor: 'pointer', fontSize: '0.75rem' }}>
                      Revoke
                    </button>
                  </div>
                  <label className="api-key-model-assign">
                    <span>{t('integration.assignModelLabel')}</span>
                    <select
                      className="select-input"
                      value={k.model_id || ''}
                      onChange={e => handleAssignModel(k.id, e.target.value || null)}
                    >
                      <option value="">{t('integration.autoModelOption')}</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          )}

          <p className="card-hint">{t('integration.apiKeyHint')}</p>
        </div>

        <div className="dash-card flex-grow">
          <div className="code-card-header">
            <h2 className="card-title">{t('integration.snippetTitle')}</h2>
            <button className="btn-copy" onClick={copySnippet} aria-live="polite">
              <FontAwesomeIcon icon={faCopy} /> {copied ? t('integration.copied') : t('integration.copyCode')}
            </button>
          </div>
          <pre className="code-pre"><code>{snippet}</code></pre>
        </div>
      </div>

      <div className="dash-card info-card">
        <h2 className="card-title">{t('integration.platformsTitle')}</h2>
        <div className="platforms-grid">
          {['Shopify', 'WooCommerce', 'Vtex', 'Magento', 'PrestaShop', 'HTML puro'].map(p => (
            <span key={p} className="platform-tag">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_BRAND_COLOR = '#53a0f8';
const DEFAULT_BTN_TEXT = '¿Cuál es mi talla?';
const DEFAULT_MODAL_BG_COLOR = '#ffffff';
const MODAL_BG_SWATCHES = ['#ffffff', '#f8fafc', '#111827', '#1f2937', '#fef3c7', '#ecfdf5'];

const BRAND_COLOR_SWATCHES = ['#53a0f8', '#e63946', '#5db35d', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9', '#1f2937'];
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function isDarkHexColor(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return false;
  const [, r, g, b] = match;
  const luminance = (parseInt(r, 16) * 299 + parseInt(g, 16) * 587 + parseInt(b, 16) * 114) / 1000;
  return luminance < 140;
}

function ApiKeyBrandingCard({ apiKey, models, onSave }) {
  const { t } = useTranslation('dashboard');
  const savedColor = apiKey.brand_color || DEFAULT_BRAND_COLOR;
  const savedBtnText = apiKey.button_text || DEFAULT_BTN_TEXT;
  const savedModalBg = apiKey.modal_bg_color || DEFAULT_MODAL_BG_COLOR;
  const [color, setColor]     = useState(savedColor);
  const [hexDraft, setHexDraft] = useState(savedColor);
  const [btnText, setBtnText] = useState(savedBtnText);
  const [modalBg, setModalBg] = useState(savedModalBg);
  const [modalBgHexDraft, setModalBgHexDraft] = useState(savedModalBg);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const isDirty = color !== savedColor || btnText !== savedBtnText || modalBg !== savedModalBg;
  const assignedModel = models.find(m => m.id === apiKey.model_id);
  const modelLabel = apiKey.model_id
    ? (assignedModel?.name || t('customization.modelNotFound'))
    : t('integration.autoModelOption');
  // Light backgrounds need dark preview text/lines to stay legible, and vice versa.
  const modalBgIsDark = isDarkHexColor(modalBg);

  function pickColor(newColor) {
    setColor(newColor);
    setHexDraft(newColor);
  }

  function handleHexChange(value) {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    setHexDraft(normalized);
    if (HEX_COLOR_REGEX.test(normalized)) setColor(normalized);
  }

  function handleHexBlur() {
    if (!HEX_COLOR_REGEX.test(hexDraft)) setHexDraft(color);
  }

  function pickModalBg(newColor) {
    setModalBg(newColor);
    setModalBgHexDraft(newColor);
  }

  function handleModalBgHexChange(value) {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    setModalBgHexDraft(normalized);
    if (HEX_COLOR_REGEX.test(normalized)) setModalBg(normalized);
  }

  function handleModalBgHexBlur() {
    if (!HEX_COLOR_REGEX.test(modalBgHexDraft)) setModalBgHexDraft(modalBg);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const ok = await onSave(apiKey.id, color, btnText, modalBg);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-card branding-card">
      <div className="branding-card-header">
        <span className="branding-card-icon"><FontAwesomeIcon icon={faKey} /></span>
        <div>
          <h3 className="card-title">{t('customization.keyCardTitle')}</h3>
          <code className="branding-card-prefix">{apiKey.key_prefix}••••</code>
        </div>
      </div>

      <span className="branding-model-badge">
        <FontAwesomeIcon icon={faBrain} /> {modelLabel}
      </span>

      <div className="custom-field">
        {/* This label visually introduces BOTH inputs below (the color swatch
            picker and its hex text twin) rather than one specific control, so
            it isn't wired via htmlFor — each input instead carries its own
            aria-label (WCAG 4.1.2) with the same text. */}
        <label id={`brand-color-label-${apiKey.id}`}>{t('customization.colorLabel')}</label>
        <div className="color-row">
          <input
            type="color"
            value={color}
            onChange={e => pickColor(e.target.value)}
            aria-label={t('customization.colorLabel')}
          />
          <input
            type="text"
            className="text-input color-hex-input"
            value={hexDraft}
            maxLength={7}
            spellCheck={false}
            onChange={e => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            aria-label={t('customization.colorLabel')}
          />
        </div>
        <div className="color-swatch-row">
          {BRAND_COLOR_SWATCHES.map(swatch => (
            <button
              key={swatch}
              type="button"
              className={`color-swatch${color.toLowerCase() === swatch ? ' color-swatch--active' : ''}`}
              style={{ background: swatch }}
              onClick={() => pickColor(swatch)}
              aria-label={swatch}
            />
          ))}
        </div>
      </div>

      <div className="custom-field">
        <div className="custom-field-label-row">
          <label htmlFor={`brand-btn-text-${apiKey.id}`}>{t('customization.btnLabel')}</label>
          <span className="char-counter">{btnText.length}/60</span>
        </div>
        <input id={`brand-btn-text-${apiKey.id}`} type="text" className="text-input" value={btnText}
          onChange={e => setBtnText(e.target.value)} maxLength={60} />
      </div>

      <div className="custom-field">
        {/* Same rationale as the brand-color label above: introduces both
            the swatch picker and its hex text twin. */}
        <label id={`modal-bg-label-${apiKey.id}`}>{t('customization.modalBgLabel')}</label>
        <div className="color-row">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(modalBg) ? modalBg : DEFAULT_MODAL_BG_COLOR}
            onChange={e => pickModalBg(e.target.value)}
            aria-label={t('customization.modalBgLabel')}
          />
          <input
            type="text"
            className="text-input color-hex-input"
            value={modalBgHexDraft}
            maxLength={7}
            spellCheck={false}
            onChange={e => handleModalBgHexChange(e.target.value)}
            onBlur={handleModalBgHexBlur}
            aria-label={t('customization.modalBgLabel')}
          />
        </div>
        <div className="color-swatch-row">
          {MODAL_BG_SWATCHES.map(swatch => (
            <button
              key={swatch}
              type="button"
              className={`color-swatch${modalBg.toLowerCase() === swatch ? ' color-swatch--active' : ''}`}
              style={{ background: swatch }}
              onClick={() => pickModalBg(swatch)}
              aria-label={swatch}
            />
          ))}
        </div>
      </div>

      <div className="branding-save-row">
        <button className="btn-primary-dash" onClick={handleSave} disabled={saving || !isDirty} aria-live="polite">
          {saving
            ? <FontAwesomeIcon icon={faSpinner} spin />
            : saved
              ? <><FontAwesomeIcon icon={faCheck} /> {t('customization.savedBtn')}</>
              : t('customization.saveBtn')
          }
        </button>
        {isDirty && !saving && <span className="unsaved-hint" role="status">{t('customization.unsavedHint')}</span>}
      </div>

      <p className="card-hint preview-label">{t('customization.previewHint')}</p>
      <div
        className={`preview-mockup${modalBgIsDark ? ' preview-mockup--dark' : ''}`}
        style={{ background: HEX_COLOR_REGEX.test(modalBg) ? modalBg : DEFAULT_MODAL_BG_COLOR }}
      >
        <div className="preview-product-img"><FontAwesomeIcon icon={faShirt} /></div>
        <div className="preview-info">
          <div className="preview-line w60" />
          <div className="preview-line w40" />
          <button className="preview-cta" style={{ background: color, borderColor: color }}>
            {btnText || DEFAULT_BTN_TEXT}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomizationSection({ user }) {
  const { t } = useTranslation('dashboard');
  const [apiKeys, setApiKeys] = useState([]);
  const [models, setModels]   = useState([]);
  const [loaded, setLoaded]   = useState(false);

  const eligible = (user?.plan || '').toLowerCase() !== 'starter';

  useEffect(() => {
    if (!eligible) { setLoaded(true); return; }
    Promise.all([
      apiFetch('/api-keys').then(r => r.ok ? r.json() : []),
      apiFetch('/models').then(r => r.ok ? r.json() : []),
    ])
      .then(([keysData, modelsData]) => {
        if (Array.isArray(keysData)) setApiKeys(keysData);
        if (Array.isArray(modelsData)) setModels(modelsData);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  async function handleSaveBranding(keyId, brandColor, buttonText, modalBgColor) {
    const res = await apiFetch(`/api-keys/${keyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ brand_color: brandColor, button_text: buttonText, modal_bg_color: modalBgColor }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApiKeys(prev => prev.map(k => (k.id === updated.id ? updated : k)));
      return true;
    }
    return false;
  }

  if (!eligible) {
    return (
      <div className="section-content">
        <div className="dash-card">
          <h2 className="card-title">{t('customization.upsellTitle')}</h2>
          <p className="card-desc">{t('customization.upsellDesc')}</p>
          <p className="upload-summary error model-limit-msg" style={{ display: 'inline-block' }}>
            <Link to="/pricing">{t('model.limitReachedHint')}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return <div className="section-content"><p className="card-hint" role="status">…</p></div>;
  }

  if (apiKeys.length === 0) {
    return (
      <div className="section-content">
        <div className="dash-card">
          <h2 className="card-title">{t('customization.title')}</h2>
          <p className="card-hint">{t('customization.noKeysHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-content">
      <div className="section-heading">
        <h2 className="card-title">{t('customization.title')}</h2>
        <p className="card-desc">{t('customization.sectionDesc')}</p>
      </div>
      <div className="branding-card-grid">
        {apiKeys.map(k => (
          <ApiKeyBrandingCard key={k.id} apiKey={k} models={models} onSave={handleSaveBranding} />
        ))}
      </div>
    </div>
  );
}

function computeRenewalDate(startedAt, billingCycle) {
  if (!startedAt) return null;
  const addInterval = (d) => billingCycle === 'annual'
    ? new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
    : new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const now = new Date();
  let next = addInterval(new Date(startedAt));
  while (next < now) next = addInterval(next);
  return next;
}

function PaymentModal({ planName, price, onCancel, onConfirm }) {
  const { t } = useTranslation('dashboard');
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useFocusTrap(cardRef, true);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onCancel]);

  const cardDigits = cardNumber.replace(/\s/g, '');
  const isValid = /^\d{16}$/.test(cardDigits) && /^\d{2}\/\d{2}$/.test(expiry) && /^\d{3,4}$/.test(cvc);

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isValid) onConfirm();
  }

  return (
    <div className="modal-backdrop" ref={overlayRef} onClick={e => e.target === overlayRef.current && onCancel()}>
      <div
        className="modal-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="payment-modal-title">{t('plan.paymentTitle')}</h2>
          <button className="modal-close-btn" onClick={onCancel} aria-label={t('model.cancelBtn')}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="modal-body">
          <p className="card-desc payment-modal-desc">
            {t('plan.paymentDesc', { plan: planName, price })}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="custom-field">
              <label htmlFor="payment-card-number">{t('plan.cardNumberLabel')}</label>
              <input
                id="payment-card-number"
                type="text" className="text-input" placeholder="4242 4242 4242 4242"
                value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                inputMode="numeric" autoComplete="cc-number"
              />
            </div>
            <div className="payment-row">
              <div className="custom-field" style={{ flex: 1 }}>
                <label htmlFor="payment-card-expiry">{t('plan.cardExpiryLabel')}</label>
                <input
                  id="payment-card-expiry"
                  type="text" className="text-input" placeholder="MM/YY"
                  value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                  inputMode="numeric" autoComplete="cc-exp"
                />
              </div>
              <div className="custom-field" style={{ flex: 1 }}>
                <label htmlFor="payment-card-cvc">{t('plan.cardCvcLabel')}</label>
                <input
                  id="payment-card-cvc"
                  type="text" className="text-input" placeholder="123"
                  value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric" autoComplete="cc-csc"
                />
              </div>
            </div>
            <p className="card-hint payment-disclaimer">
              <FontAwesomeIcon icon={faShieldHalved} /> {t('plan.paymentDisclaimer')}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-outline" onClick={onCancel}>{t('model.cancelBtn')}</button>
              <button type="submit" className="btn-primary-dash" disabled={!isValid}>{t('plan.payAndContinueBtn')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PlanSection() {
  const { t, i18n } = useTranslation('dashboard');
  const { refreshUser } = useAuth();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmCancelPending, setConfirmCancelPending] = useState(false);
  // { planId, planName, price, cycle? } — the change awaiting a payment step and/or
  // final confirmation, before it's actually scheduled via PATCH /subscriptions/current.
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [confirmRequest, setConfirmRequest] = useState(null);

  function loadSubscription() {
    return apiFetch('/subscriptions/current').then(r => (r.ok ? r.json() : null)).then(setSub);
  }

  useEffect(() => {
    Promise.all([
      loadSubscription(),
      apiFetch('/plans').then(r => (r.ok ? r.json() : [])).then(data => { if (Array.isArray(data)) setPlans(data); }),
    ]).catch(() => {}).finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestPlanSwitch(planId, planName, price) {
    setActionError(null);
    if (price > 0) {
      setPaymentRequest({ planId, planName, price });
    } else {
      setConfirmRequest({ planId, planName });
    }
  }

  function requestBillingToggle() {
    if (!sub) return;
    const nextCycle = sub.billing_cycle === 'annual' ? 'monthly' : 'annual';
    setConfirmRequest({ cycle: nextCycle });
  }

  async function scheduleChange({ planId, cycle }) {
    setSwitchingId(planId ?? 'cycle');
    try {
      const body = {};
      if (planId) body.plan_id = planId;
      if (cycle) body.billing_cycle = cycle;
      const res = await apiFetch('/subscriptions/current', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSub(await res.json());
      } else {
        const resBody = await res.json().catch(() => ({}));
        setActionError(resBody.message || t('plan.switchError'));
      }
    } finally {
      setSwitchingId(null);
      setConfirmRequest(null);
      setPaymentRequest(null);
    }
  }

  async function performCancelPending() {
    const res = await apiFetch('/subscriptions/pending', { method: 'DELETE' });
    setConfirmCancelPending(false);
    if (res.ok) setSub(await res.json());
  }

  async function performCancel() {
    await apiFetch('/subscriptions/current', { method: 'DELETE' });
    setConfirmCancel(false);
    await loadSubscription();
    refreshUser({ plan: 'starter' });
  }

  if (!loaded) return <div className="section-content"><p className="card-hint" role="status">…</p></div>;

  const currentPlanName = sub?.plan?.name;
  const renewsOn = sub && sub.status === 'active'
    ? computeRenewalDate(sub.started_at, sub.billing_cycle)
    : null;
  const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
  const formatDate = (d) => d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const pendingPlan = sub?.pending_plan_id ? plans.find(p => p.id === sub.pending_plan_id) : null;

  return (
    <div className="section-content">
      <div className="dash-card plan-current-card">
        <h2 className="card-title"><FontAwesomeIcon icon={faCrown} className="title-icon" /> {t('plan.currentTitle')}</h2>
        <div className="plan-current-row">
          <span className="plan-current-name">{currentPlanName}</span>
          <span className={`model-status-badge ${sub?.status === 'active' ? 'ready' : 'error'}`}>{sub?.status}</span>
        </div>
        {renewsOn && (
          <p className="card-hint plan-renewal-hint">
            {t('plan.renewsOn', { date: formatDate(renewsOn) })}
          </p>
        )}
        {(pendingPlan || sub?.pending_billing_cycle) && sub?.scheduled_at && (
          <div className="plan-pending-banner">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>
              {pendingPlan
                ? t('plan.pendingPlanChange', { plan: pendingPlan.name, date: formatDate(new Date(sub.scheduled_at)) })
                : t('plan.pendingCycleChange', { cycle: t(`plan.${sub.pending_billing_cycle}`), date: formatDate(new Date(sub.scheduled_at)) })}
            </span>
            <button className="plan-cancel-link" onClick={() => setConfirmCancelPending(true)}>{t('plan.cancelPendingBtn')}</button>
          </div>
        )}
        {sub?.billing_cycle && currentPlanName !== 'enterprise' && (
          <div className="billing-toggle">
            <span className={sub.billing_cycle !== 'annual' ? 'active' : ''}>{t('plan.monthly')}</span>
            <button
              className={`toggle-switch${sub.billing_cycle === 'annual' ? ' on' : ''}`}
              onClick={requestBillingToggle}
              role="switch"
              aria-checked={sub.billing_cycle === 'annual'}
              aria-label={t('plan.billingToggleLabel')}
            >
              <span className="toggle-thumb" />
            </button>
            <span className={sub.billing_cycle === 'annual' ? 'active' : ''}>{t('plan.annual')}</span>
          </div>
        )}
        {currentPlanName && currentPlanName !== 'starter' && (
          <button className="plan-cancel-link" onClick={() => setConfirmCancel(true)}>{t('plan.cancelBtn')}</button>
        )}
      </div>

      {actionError && <div className="upload-summary error" role="alert">{actionError}</div>}

      <div className="plan-grid">
        {plans.map(p => {
          const isCurrent = p.name === currentPlanName;
          const isPendingTarget = p.id === sub?.pending_plan_id;
          const isEnterprisePlan = p.name === 'enterprise';
          const price = sub?.billing_cycle === 'annual' ? p.price_annual : p.price_monthly;
          return (
            <div key={p.id} className={`dash-card plan-option-card${isCurrent ? ' plan-option-card--current' : ''}`}>
              {isCurrent && <span className="plan-current-badge">{t('plan.currentBadge')}</span>}
              {!isCurrent && isPendingTarget && <span className="plan-current-badge plan-current-badge--pending">{t('plan.scheduledBadge')}</span>}
              <h2 className="card-title plan-option-name">{p.name}</h2>
              <p className="plan-option-price">
                {price > 0 ? <>${price}<span className="plan-option-period">/{t('plan.mo')}</span></> : t('plan.free')}
              </p>
              <ul className="plan-option-features">
                <li>{p.max_models === -1 ? t('plan.unlimitedModels') : t('plan.maxModels', { count: p.max_models })}</li>
                <li>{p.max_predictions_per_month === -1 ? t('plan.unlimitedPredictions') : t('plan.maxPredictions', { count: p.max_predictions_per_month })}</li>
              </ul>
              {isCurrent ? (
                <button className="btn-outline" disabled>{t('plan.currentBadge')}</button>
              ) : isEnterprisePlan ? (
                <Link to="/contact" className="btn-outline plan-contact-link">{t('plan.contactSales')}</Link>
              ) : (
                <button
                  className="btn-primary-dash"
                  onClick={() => requestPlanSwitch(p.id, p.name, price)}
                  disabled={switchingId === p.id}
                >
                  {switchingId === p.id ? <FontAwesomeIcon icon={faSpinner} spin /> : t('plan.switchBtn')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {paymentRequest && (
        <PaymentModal
          planName={paymentRequest.planName}
          price={paymentRequest.price}
          onCancel={() => setPaymentRequest(null)}
          onConfirm={() => {
            setConfirmRequest({ planId: paymentRequest.planId, planName: paymentRequest.planName });
            setPaymentRequest(null);
          }}
        />
      )}

      {confirmRequest && (
        <ConfirmModal
          title={t('plan.switchConfirmTitle')}
          message={confirmRequest.planName
            ? t('plan.switchConfirmMsg', { plan: confirmRequest.planName, date: renewsOn ? formatDate(renewsOn) : '' })
            : t('plan.cycleConfirmMsg', { cycle: t(`plan.${confirmRequest.cycle}`), date: renewsOn ? formatDate(renewsOn) : '' })}
          confirmLabel={t('plan.confirmChangeBtn')}
          cancelLabel={t('model.cancelBtn')}
          onConfirm={() => scheduleChange(confirmRequest)}
          onCancel={() => setConfirmRequest(null)}
        />
      )}

      {confirmCancelPending && (
        <ConfirmModal
          title={t('plan.cancelPendingConfirmTitle')}
          message={t('plan.cancelPendingConfirmMsg')}
          confirmLabel={t('plan.cancelPendingBtn')}
          cancelLabel={t('model.cancelBtn')}
          danger
          onConfirm={performCancelPending}
          onCancel={() => setConfirmCancelPending(false)}
        />
      )}

      {confirmCancel && (
        <ConfirmModal
          title={t('plan.cancelConfirmTitle')}
          message={t('plan.cancelConfirmMsg')}
          confirmLabel={t('plan.cancelConfirmBtn')}
          cancelLabel={t('model.cancelBtn')}
          danger
          onConfirm={performCancel}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </div>
  );
}

function ProfileSection({ user }) {
  const { t } = useTranslation('dashboard');
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [brandName, setBrandName] = useState(user.brand_name || user.brand || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const savedName = user.name || '';
  const savedBrand = user.brand_name || user.brand || '';
  const isProfileDirty = name !== savedName || brandName !== savedBrand;

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, brand_name: brandName }),
      });
      if (res.ok) {
        const updated = await res.json();
        refreshUser({ name: updated.name, brand_name: updated.brand_name, brand: updated.brand_name || updated.name });
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      } else {
        const body = await res.json().catch(() => ({}));
        setProfileError(body.message || t('profile.saveError'));
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      const res = await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (res.ok) {
        setPasswordSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSaved(false), 2500);
      } else {
        const body = await res.json().catch(() => ({}));
        setPasswordError(body.message || t('profile.passwordError'));
      }
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="section-content">
      <div className="dash-card">
        <h2 className="card-title"><FontAwesomeIcon icon={faIdCard} className="title-icon" /> {t('profile.title')}</h2>
        <div className="custom-field">
          <label id="profile-email-label">{t('profile.emailLabel')}</label>
          <p className="profile-readonly-value" aria-labelledby="profile-email-label">{user.email}</p>
        </div>
        <div className="custom-field">
          <label htmlFor="profile-name">{t('profile.nameLabel')}</label>
          <input id="profile-name" type="text" className="text-input" value={name} maxLength={120}
            onChange={e => setName(e.target.value)} />
        </div>
        <div className="custom-field">
          <label htmlFor="profile-brand">{t('profile.brandLabel')}</label>
          <input id="profile-brand" type="text" className="text-input" value={brandName} maxLength={120}
            onChange={e => setBrandName(e.target.value)} />
        </div>
        {profileError && <div className="upload-summary error" role="alert">{profileError}</div>}
        <button className="btn-primary-dash" onClick={handleSaveProfile} disabled={savingProfile || !isProfileDirty} aria-live="polite">
          {savingProfile
            ? <FontAwesomeIcon icon={faSpinner} spin />
            : profileSaved ? <><FontAwesomeIcon icon={faCheck} /> {t('profile.savedBtn')}</> : t('profile.saveBtn')}
        </button>
      </div>

      <div className="dash-card">
        <h2 className="card-title"><FontAwesomeIcon icon={faUserPen} className="title-icon" /> {t('profile.passwordTitle')}</h2>
        <form onSubmit={handleChangePassword}>
          <div className="custom-field">
            <label htmlFor="profile-current-password">{t('profile.currentPasswordLabel')}</label>
            <input id="profile-current-password" type="password" className="text-input" value={currentPassword} required
              autoComplete="current-password" onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="custom-field">
            <label htmlFor="profile-new-password">{t('profile.newPasswordLabel')}</label>
            <input id="profile-new-password" type="password" className="text-input" value={newPassword} required minLength={6}
              autoComplete="new-password" onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="custom-field">
            <label htmlFor="profile-confirm-password">{t('profile.confirmPasswordLabel')}</label>
            <input id="profile-confirm-password" type="password" className="text-input" value={confirmPassword} required minLength={6}
              autoComplete="new-password" onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          {passwordError && <div className="upload-summary error" role="alert">{passwordError}</div>}
          <button type="submit" className="btn-primary-dash"
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} aria-live="polite">
            {savingPassword
              ? <FontAwesomeIcon icon={faSpinner} spin />
              : passwordSaved ? <><FontAwesomeIcon icon={faCheck} /> {t('profile.savedBtn')}</> : t('profile.changePasswordBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function TeamSection({ user }) {
  const { t } = useTranslation('team');
  const [org, setOrg]               = useState(null);
  const [membership, setMembership] = useState(null);
  const [members, setMembers]       = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const [loadError, setLoadError]   = useState(false);

  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviteRole, setInviteRole]       = useState('member');
  const [inviting, setInviting]           = useState(false);
  const [inviteMsg, setInviteMsg]         = useState(null); // { type: 'success'|'error', text }

  const [readonlyData, setReadonlyData]     = useState(null);
  const [readonlyError, setReadonlyError]   = useState(false);
  const [confirmMemberId, setConfirmMemberId] = useState(null);

  function loadMe() {
    apiFetch('/organizations/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setOrg(data.organization || null);
        setMembership(data.membership || null);
        setMembers(Array.isArray(data.members) ? data.members : []);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!org || !membership || membership.role === 'admin') return;
    apiFetch('/organizations/dashboard')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setReadonlyData(data); setReadonlyError(false); })
      .catch(() => setReadonlyError(true));
  }, [org, membership]);

  async function handleInvite(e) {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await apiFetch('/organizations/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInviteMsg({ type: 'success', text: t('invite.success') });
        setInviteEmail('');
        loadMe();
      } else {
        const body = await res.json().catch(() => ({}));
        setInviteMsg({ type: 'error', text: body.message || t('invite.error') });
      }
    } catch {
      setInviteMsg({ type: 'error', text: t('invite.error') });
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId, role) {
    await apiFetch(`/organizations/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    loadMe();
  }

  function handleRemove(memberId) {
    setConfirmMemberId(memberId);
  }

  async function performRemove() {
    await apiFetch(`/organizations/members/${confirmMemberId}`, { method: 'DELETE' });
    setConfirmMemberId(null);
    loadMe();
  }

  if (!loaded) {
    return <div className="section-content"><p className="card-hint" role="status">…</p></div>;
  }

  if (!org) {
    return (
      <div className="section-content">
        <div className="dash-card">
          <p className="card-desc">{loadError ? t('readonly.loadError') : t('readonly.noOrganization')}</p>
        </div>
      </div>
    );
  }

  if (membership?.role === 'admin') {
    return (
      <div className="section-content">
        <div className="dash-card">
          <h2 className="card-title">{t('invite.title')}</h2>
          <p className="card-desc">{t('invite.desc')}</p>
          <form className="team-invite-form" onSubmit={handleInvite}>
            <div className="team-invite-row">
              <div className="custom-field" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="team-invite-email">{t('invite.emailLabel')}</label>
                <input
                  id="team-invite-email" type="email" className="text-input"
                  placeholder={t('invite.emailPlaceholder')}
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                />
              </div>
              <div className="custom-field" style={{ marginBottom: 0 }}>
                <label htmlFor="team-invite-role">{t('invite.roleLabel')}</label>
                <select
                  id="team-invite-role" className="select-input"
                  value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="member">{t('invite.roleMember')}</option>
                  <option value="admin">{t('invite.roleAdmin')}</option>
                </select>
              </div>
              <button type="submit" className="btn-primary-dash" disabled={inviting}>
                {inviting
                  ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('invite.submitting')}</>
                  : <><FontAwesomeIcon icon={faPaperPlane} /> {t('invite.submit')}</>
                }
              </button>
            </div>
          </form>
          {inviteMsg && (
            <div
              className={`upload-summary ${inviteMsg.type}`}
              style={{ marginTop: 12 }}
              role={inviteMsg.type === 'error' ? 'alert' : 'status'}
            >
              {inviteMsg.text}
            </div>
          )}
        </div>

        <div className="dash-card">
          <h2 className="card-title">{t('members.title')}</h2>
          {members.length === 0 ? (
            <p className="card-hint">{t('members.empty')}</p>
          ) : (
            <table className="team-members-table">
              <thead>
                <tr>
                  <th>{t('members.colEmail')}</th>
                  <th>{t('members.colRole')}</th>
                  <th>{t('members.colStatus')}</th>
                  <th>{t('members.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>{m.email}</td>
                    <td>
                      <select
                        className="select-input team-role-select"
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                        aria-label={`${t('members.colRole')}: ${m.email}`}
                      >
                        <option value="member">{t('invite.roleMember')}</option>
                        <option value="admin">{t('invite.roleAdmin')}</option>
                      </select>
                    </td>
                    <td>
                      <span className={`team-status-badge ${m.status}`}>
                        {m.status === 'active' ? t('members.statusActive') : t('members.statusPending')}
                      </span>
                    </td>
                    <td>
                      <button className="team-remove-btn" onClick={() => handleRemove(m.id)}>
                        <FontAwesomeIcon icon={faTrash} /> {t('members.removeBtn')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {confirmMemberId && (
          <ConfirmModal
            title={t('members.removeConfirmTitle')}
            message={t('members.removeConfirm')}
            confirmLabel={t('members.removeBtn')}
            cancelLabel={t('members.cancelBtn')}
            danger
            onConfirm={performRemove}
            onCancel={() => setConfirmMemberId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="section-content">
      <div className="team-readonly-banner">{t('readonly.banner')}</div>

      {readonlyError && <p className="card-hint" role="alert">{t('readonly.loadError')}</p>}

      {readonlyData && (
        <>
          {readonlyData.overview && (
            <div className="stats-grid">
              {Object.entries(readonlyData.overview).map(([key, value]) => (
                <div key={key} className="stat-card">
                  <p className="stat-label">{key}</p>
                  <p className="stat-value">{typeof value === 'number' ? value : String(value)}</p>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(readonlyData.distribution) && readonlyData.distribution.length > 0 && (
            <div className="dist-card">
              <h2 className="card-title">{t('readonly.distTitle')}</h2>
              <div className="dist-bars">
                {readonlyData.distribution.map(({ size, pct }) => (
                  <div key={size} className="dist-row">
                    <span className="dist-size">{size}</span>
                    <div className="dist-bar-track">
                      <div className="dist-bar-fill" style={{ width: `${pct}%`, background: 'var(--color-accent)' }} />
                    </div>
                    <span className="dist-pct">{pct} %</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(readonlyData.models) && readonlyData.models.length > 0 && (
            <div className="dash-card">
              <h2 className="card-title">{t('readonly.modelsTitle')}</h2>
              <table className="team-members-table">
                <thead>
                  <tr>
                    <th>{t('readonly.modelName')}</th>
                    <th>{t('readonly.modelStatus')}</th>
                    <th>{t('readonly.modelAccuracy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {readonlyData.models.map(m => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.status}</td>
                      <td>{m.accuracy != null ? `${Math.round(m.accuracy * 1000) / 10}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { t }            = useTranslation('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  const isEnterprise = (user?.plan || '').toLowerCase() === 'enterprise';
  const navIds   = isEnterprise ? [...NAV_IDS, 'team']   : NAV_IDS;
  const navIcons = isEnterprise ? [...NAV_ICONS, faUsers] : NAV_ICONS;

  useEffect(() => {
    const pendingToken = sessionStorage.getItem('usize_invite_token');
    if (!pendingToken || !user) return;
    apiFetch('/organizations/accept-invite', { method: 'POST', body: JSON.stringify({ token: pendingToken }) })
      .then(r => { if (r.ok) sessionStorage.removeItem('usize_invite_token'); })
      .catch(() => {});
  }, [user]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const activeLabel = t(`nav.${activeTab}`);

  usePageTitle(`${activeLabel} — ${t('pageTitle')}`);

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
            {navIds.map((id, i) => (
              <button
                key={id}
                className={`sidebar-item${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <FontAwesomeIcon icon={navIcons[i]} className="sidebar-icon" />
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

      <main className="dash-main" id="main-content">
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
              <PerModelOverview />
            </>
          )}
          {activeTab === 'model'         && <ModelSection user={user} />}
          {activeTab === 'integration'   && <IntegrationSection user={user} />}
          {activeTab === 'customization' && <CustomizationSection user={user} />}
          {activeTab === 'plan'          && <PlanSection user={user} />}
          {activeTab === 'profile'       && <ProfileSection user={user} />}
          {activeTab === 'team'          && <TeamSection user={user} />}
        </div>
      </main>
    </div>
  );
}
