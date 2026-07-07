import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSpinner, faRulerCombined,
  faRulerHorizontal, faRulerVertical, faWeightScale, faCalendarDays, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useModel } from '../context/ModelContext';
import { predictSize, SIZE_POSITIONS } from '../ml/modelConfig';
import svg from './up-arrow.min.svg';
import './UsizeForm.css';

const FIELDS = [
  { id: 'espalda', labelKey: 'back',   icon: faRulerHorizontal, unit: 'cm', placeholder: '42' },
  { id: 'altura',  labelKey: 'height', icon: faRulerVertical,   unit: 'cm', placeholder: '170' },
  { id: 'peso',    labelKey: 'weight', icon: faWeightScale,     unit: 'kg', placeholder: '70' },
  { id: 'edad',    labelKey: 'age',    icon: faCalendarDays,    unit: 'ageUnit', placeholder: '28' },
];

function SizeMeter({ size }) {
  const { t } = useTranslation('form');
  const position = SIZE_POSITIONS[size] ?? 50;
  return (
    <div className="size-meter">
      <div className="size-meter-labels">
        <span>{t('meter.tight')}</span>
        <span>{t('meter.perfect')}</span>
        <span>{t('meter.loose')}</span>
      </div>
      <div className="size-meter-bar">
        <div className="size-meter-fill size-meter-fill--left" />
        <div className="size-meter-fill size-meter-fill--center" />
        <div className="size-meter-fill size-meter-fill--right" />
        <img
          className="size-meter-marker"
          src={svg}
          alt={t('meter.indicatorAlt')}
          style={{ left: `${position}%` }}
        />
      </div>
    </div>
  );
}

function SizeResult({ size, onBack }) {
  const { t } = useTranslation('form');
  return (
    <div className="size-result">
      <p className="size-result-label">{t('resultLabel')}</p>
      <div className="size-result-display">
        <span className="size-result-value">{size}</span>
      </div>
      <SizeMeter size={size} />
      <button className="btn-secondary" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} /> {t('tryAgain')}
      </button>
    </div>
  );
}

function FieldInput({ field, value, onChange, touched, onBlur }) {
  const { t } = useTranslation('form');
  const isInvalid = touched && value === '';
  const unitLabel = field.unit === 'ageUnit' ? t('ageUnit') : field.unit;
  const errorHintId = `${field.id}-error`;

  return (
    <div className={`field-group${isInvalid ? ' field-group--invalid' : ''}`}>
      <label className="field-label" htmlFor={field.id}>
        <FontAwesomeIcon icon={field.icon} className="field-label-icon" />
        {t(field.labelKey)}
      </label>
      <div className="field-input-wrap">
        <input
          id={field.id} type="number" name={field.id} className="field-input"
          placeholder={field.placeholder}
          value={value}
          onChange={e => onChange(field.id, e.target.value)}
          onBlur={() => onBlur(field.id)}
          required
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorHintId : undefined}
        />
        {unitLabel && <span className="field-unit">{unitLabel}</span>}
      </div>
      {isInvalid && (
        <span className="field-error-hint" id={errorHintId} role="alert">{t('requiredHint')}</span>
      )}
    </div>
  );
}

function UsizeForm() {
  const { modelStatus } = useModel();
  const { t } = useTranslation('form');
  const [step, setStep] = useState('form');
  const [predictedSize, setPredictedSize] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [values, setValues] = useState({ espalda: '', altura: '', peso: '', edad: '' });
  const [touched, setTouched] = useState({});

  function handleFieldChange(id, value) {
    setValues(prev => ({ ...prev, [id]: value }));
  }

  function handleFieldBlur(id) {
    setTouched(prev => ({ ...prev, [id]: true }));
  }

  function isFormValid() {
    return FIELDS.every(f => values[f.id] !== '' && !Number.isNaN(parseFloat(values[f.id])));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ espalda: true, altura: true, peso: true, edad: true });
    if (!isFormValid()) return;

    const back   = parseFloat(values.espalda);
    const height = parseFloat(values.altura);
    const weight = parseFloat(values.peso);
    const age    = parseFloat(values.edad);

    setStep('loading');
    setErrorMsg('');

    try {
      const size = await predictSize(back, height, weight, age);
      setPredictedSize(size);
      setStep('result');
    } catch {
      setErrorMsg(t('errorModel'));
      setStep('error');
    }
  }

  if (step === 'result') {
    return <SizeResult size={predictedSize} onBack={() => setStep('form')} />;
  }

  const isModelReady = modelStatus === 'ready';
  const isLoading    = step === 'loading' || !isModelReady;
  const submitLabel  = step === 'loading'             ? t('predicting')
                     : modelStatus === 'checking'     ? t('checkingModel')
                     : modelStatus === 'initializing' ? t('initializingAI')
                     : null;

  return (
    <div className="usize-form">
      <p className="form-subtitle">{t('subtitle')}</p>

      {step === 'error' && (
        <div className="form-error" role="alert">{errorMsg}</div>
      )}

      {modelStatus === 'initializing' && (
        <div className="form-info" role="status">
          <FontAwesomeIcon icon={faSpinner} spin />
          {t('initializing')}
        </div>
      )}

      <form className="measurement-form" onSubmit={handleSubmit} noValidate>
        <div className="field-grid">
          {FIELDS.map(field => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.id]}
              touched={!!touched[field.id]}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> {submitLabel}</>
          ) : (
            <><FontAwesomeIcon icon={faRulerCombined} /> {t('predict')}</>
          )}
        </button>

        <p className="form-trust-note">
          <FontAwesomeIcon icon={faShieldHalved} /> {t('privacyNote')}
        </p>
      </form>
    </div>
  );
}

export default UsizeForm;
