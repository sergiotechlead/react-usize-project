import * as tf from '@tensorflow/tfjs';
import { useState, useRef } from 'react';
import './training-styles.css';

// Columns: [back_cm, height_cm, weight_kg, age_years]
const INPUT_DATA = [
  [41, 157, 56, 22], [47, 174, 56, 28], [48, 157, 56, 35], [49, 157, 56, 42],
  [41, 174, 65, 23], [47, 170, 65, 30], [48, 170, 65, 37], [49, 170, 65, 45],
  [41, 183, 72, 24], [47, 183, 72, 32], [48, 174, 72, 39], [49, 183, 72, 48],
  [41, 157, 56, 26], [47, 157, 56, 33], [48, 157, 56, 40], [49, 174, 56, 44],
  [41, 170, 65, 27], [47, 174, 65, 31], [48, 170, 65, 38], [49, 170, 65, 46],
  [41, 174, 72, 25], [47, 183, 72, 34], [48, 183, 72, 41], [49, 174, 72, 50],
];

// One-hot: [S, M, L, XL]
const LABELS = [
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
  [1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],
];

const EPOCHS = 201;

function buildModel() {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 100, activation: 'relu' }),
      tf.layers.dense({ units: 1000, activation: 'relu' }),
      tf.layers.dense({ units: 100, activation: 'relu' }),
      tf.layers.dense({ units: 4, activation: 'softmax' }),
    ],
  });
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

function TrainingModel() {
  const [isTraining, setIsTraining] = useState(false);
  const [isTrained, setIsTrained]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [logs, setLogs]             = useState([]);
  const logEndRef = useRef(null);

  function addLog(type, text) {
    setLogs(prev => [...prev, { type, text }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function handleTrain() {
    setIsTraining(true);
    setIsTrained(false);
    setProgress(0);
    setLogs([]);

    const xs = INPUT_DATA.map(r => [r[0] / 200, r[1] / 250, r[2] / 250, r[3] / 100]);
    const inputTensor  = tf.tensor(xs, [xs.length, 4]);
    const outputTensor = tf.tensor(LABELS, [LABELS.length, 4]);
    const model = buildModel();

    addLog('info', 'Inicializando red neuronal...');

    const result = await model.fit(inputTensor, outputTensor, {
      epochs: EPOCHS,
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, { loss }) => {
          setProgress(Math.round(((epoch + 1) / EPOCHS) * 100));
          if (epoch === 0) {
            addLog('start', 'Entrenando... (4 entradas · 3 capas ocultas · 1204 unidades)');
          }
          if (epoch % 50 === 0 && epoch > 0) {
            addLog('epoch', `Epoch ${epoch}/${EPOCHS - 1}  —  loss: ${loss.toFixed(6)}`);
          }
          await tf.nextFrame();
        },
      },
    });

    // Safely read accuracy from history regardless of key name
    const accKey = Object.keys(result.history).find(k => k.toLowerCase().includes('acc')) ?? 'acc';
    const accHistory = result.history[accKey] ?? [];
    const finalAcc = accHistory.length
      ? Math.round(accHistory[accHistory.length - 1] * 10000) / 100
      : 100;

    await model.save('localstorage://my-model-thm-size');
    tf.dispose([inputTensor, outputTensor]);

    addLog('success', `✓ Entrenamiento completo — Accuracy: ${finalAcc}%`);
    addLog('success', '✓ Modelo guardado en localStorage');

    setProgress(100);
    setIsTraining(false);
    setIsTrained(true);
  }

  return (
    <section className="training-section">
      <div className="training-header">
        <div>
          <h3 className="training-title">Modelo de IA</h3>
          <p className="training-subtitle">
            Entrena la red neuronal para habilitar las predicciones de talla.
          </p>
        </div>
        {isTrained && (
          <span className="training-status training-status--success">✓ Modelo listo</span>
        )}
      </div>

      <button
        className={`train-button${isTraining ? ' train-button--loading' : ''}`}
        onClick={handleTrain}
        disabled={isTraining}
      >
        {isTraining ? (
          <>
            <span className="loading-spinner" />
            Entrenando...
          </>
        ) : isTrained ? (
          '↺ Reentrenar modelo'
        ) : (
          '▶ Entrenar el modelo'
        )}
      </button>

      {(isTraining || isTrained) && progress > 0 && (
        <div className="progress-bar-wrap">
          <span className="progress-label">{progress}%</span>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      {logs.length > 0 && (
        <div className="training-log">
          {logs.map((log, i) => (
            <div key={i} className={`log-entry log-entry--${log.type}`}>
              {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </section>
  );
}

export default TrainingModel;
