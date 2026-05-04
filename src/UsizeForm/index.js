import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faRulerCombined } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useModel } from '../context/ModelContext';
import { predictSize, SIZE_POSITIONS } from '../ml/modelConfig';
import svg from './up-arrow.min.svg';
import './UsizeForm.css';

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
          alt="indicator"
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

function UsizeForm() {
  const { modelStatus } = useModel();
  const { t } = useTranslation('form');
  const [step, setStep] = useState('form');
  const [predictedSize, setPredictedSize] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const back   = parseFloat(e.target.elements.espalda.value);
    const height = parseFloat(e.target.elements.altura.value);
    const weight = parseFloat(e.target.elements.peso.value);
    const age    = parseFloat(e.target.elements.edad.value);

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

      <form className="measurement-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label" htmlFor="espalda">{t('back')}</label>
          <div className="field-input-wrap">
            <input id="espalda" type="number" name="espalda" className="field-input"
              placeholder="42" min="30" max="80" required />
            <span className="field-unit">cm</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="altura">{t('height')}</label>
          <div className="field-input-wrap">
            <input id="altura" type="number" name="altura" className="field-input"
              placeholder="170" min="140" max="220" required />
            <span className="field-unit">cm</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="peso">{t('weight')}</label>
          <div className="field-input-wrap">
            <input id="peso" type="number" name="peso" className="field-input"
              placeholder="70" min="40" max="150" required />
            <span className="field-unit">kg</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="edad">{t('age')}</label>
          <div className="field-input-wrap">
            <input id="edad" type="number" name="edad" className="field-input"
              placeholder="28" min="15" max="80" required />
            <span className="field-unit">{t('ageUnit')}</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> {submitLabel}</>
          ) : (
            <><FontAwesomeIcon icon={faRulerCombined} /> {t('predict')}</>
          )}
        </button>
      </form>
    </div>
  );
}

export default UsizeForm;
