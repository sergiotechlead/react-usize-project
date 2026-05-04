import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faRulerCombined } from '@fortawesome/free-solid-svg-icons';
import { useModel } from '../context/ModelContext';
import { predictSize, SIZE_POSITIONS } from '../ml/modelConfig';
import svg from './up-arrow.min.svg';
import './UsizeForm.css';

function SizeMeter({ size }) {
  const position = SIZE_POSITIONS[size] ?? 50;
  return (
    <div className="size-meter">
      <div className="size-meter-labels">
        <span>Ajustado</span>
        <span>A medida</span>
        <span>Holgado</span>
      </div>
      <div className="size-meter-bar">
        <div className="size-meter-fill size-meter-fill--left" />
        <div className="size-meter-fill size-meter-fill--center" />
        <div className="size-meter-fill size-meter-fill--right" />
        <img
          className="size-meter-marker"
          src={svg}
          alt="indicador"
          style={{ left: `${position}%` }}
        />
      </div>
    </div>
  );
}

function SizeResult({ size, onBack }) {
  return (
    <div className="size-result">
      <p className="size-result-label">Tu talla sugerida es</p>
      <div className="size-result-display">
        <span className="size-result-value">{size}</span>
      </div>
      <SizeMeter size={size} />
      <button className="btn-secondary" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} /> Volver a intentar
      </button>
    </div>
  );
}

function UsizeForm() {
  const { modelStatus } = useModel();
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
      setErrorMsg('Error al cargar el modelo. Verifica que haya sido entrenado.');
      setStep('error');
    }
  }

  if (step === 'result') {
    return <SizeResult size={predictedSize} onBack={() => setStep('form')} />;
  }

  const isModelReady = modelStatus === 'ready';
  const isLoading    = step === 'loading' || !isModelReady;
  const submitLabel  = step === 'loading'          ? 'Prediciendo...'
                     : modelStatus === 'checking'  ? 'Verificando modelo...'
                     : modelStatus === 'initializing' ? 'Inicializando IA...'
                     : null;

  return (
    <div className="usize-form">
      <p className="form-subtitle">Ingresa tus medidas para obtener tu talla recomendada.</p>

      {step === 'error' && (
        <div className="form-error" role="alert">{errorMsg}</div>
      )}

      {modelStatus === 'initializing' && (
        <div className="form-info" role="status">
          <FontAwesomeIcon icon={faSpinner} spin />
          Entrenando modelo base, esto toma unos segundos…
        </div>
      )}

      <form className="measurement-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label" htmlFor="espalda">Ancho de espalda</label>
          <div className="field-input-wrap">
            <input id="espalda" type="number" name="espalda" className="field-input"
              placeholder="42" min="30" max="80" required />
            <span className="field-unit">cm</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="altura">Altura</label>
          <div className="field-input-wrap">
            <input id="altura" type="number" name="altura" className="field-input"
              placeholder="170" min="140" max="220" required />
            <span className="field-unit">cm</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="peso">Peso</label>
          <div className="field-input-wrap">
            <input id="peso" type="number" name="peso" className="field-input"
              placeholder="70" min="40" max="150" required />
            <span className="field-unit">kg</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="edad">Edad</label>
          <div className="field-input-wrap">
            <input id="edad" type="number" name="edad" className="field-input"
              placeholder="28" min="15" max="80" required />
            <span className="field-unit">años</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> {submitLabel}</>
          ) : (
            <><FontAwesomeIcon icon={faRulerCombined} /> Predecir mi talla</>
          )}
        </button>
      </form>
    </div>
  );
}

export default UsizeForm;
