import * as tf from '@tensorflow/tfjs';
import { useState } from 'react';
import svg from './up-arrow.min.svg';
import './UsizeForm.css';

const SIZE_LABELS = ['S', 'M', 'L', 'XL'];

// Maps each size to a position (%) on the fit-meter bar
const SIZE_POSITIONS = { S: 12, M: 38, L: 62, XL: 88 };

async function predictSize(back, height, weight, age) {
  const model = await tf.loadLayersModel('localstorage://my-model-thm-size');
  const input = tf.tensor([[back / 200, height / 250, weight / 250, age / 100]], [1, 4]);
  const output = model.predict(input);
  const values = Array.from(output.dataSync()).map(v => Math.round(v * 100) / 100);
  const maxIndex = values.indexOf(Math.max(...values));
  tf.dispose([input, output]);
  return SIZE_LABELS[maxIndex] ?? 'M';
}

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
        ← Volver a intentar
      </button>
    </div>
  );
}

function UsizeForm() {
  const [step, setStep] = useState('form'); // 'form' | 'loading' | 'result' | 'error'
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
      setErrorMsg('Modelo no encontrado. Por favor entrena el modelo primero.');
      setStep('error');
    }
  }

  if (step === 'result') {
    return <SizeResult size={predictedSize} onBack={() => setStep('form')} />;
  }

  return (
    <div className="usize-form">
      <p className="form-subtitle">Ingresa tus medidas para obtener tu talla recomendada.</p>

      {step === 'error' && (
        <div className="form-error" role="alert">{errorMsg}</div>
      )}

      <form className="measurement-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label" htmlFor="espalda">Ancho de espalda</label>
          <div className="field-input-wrap">
            <input
              id="espalda"
              type="number"
              name="espalda"
              className="field-input"
              placeholder="42"
              min="30"
              max="80"
              required
            />
            <span className="field-unit">cm</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="altura">Altura</label>
          <div className="field-input-wrap">
            <input
              id="altura"
              type="number"
              name="altura"
              className="field-input"
              placeholder="170"
              min="140"
              max="220"
              required
            />
            <span className="field-unit">cm</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="peso">Peso</label>
          <div className="field-input-wrap">
            <input
              id="peso"
              type="number"
              name="peso"
              className="field-input"
              placeholder="70"
              min="40"
              max="150"
              required
            />
            <span className="field-unit">kg</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="edad">Edad</label>
          <div className="field-input-wrap">
            <input
              id="edad"
              type="number"
              name="edad"
              className="field-input"
              placeholder="28"
              min="15"
              max="80"
              required
            />
            <span className="field-unit">años</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={step === 'loading'}>
          {step === 'loading' ? (
            <>
              <span className="loading-spinner" />
              Prediciendo...
            </>
          ) : (
            'Predecir mi talla →'
          )}
        </button>
      </form>
    </div>
  );
}

export default UsizeForm;
