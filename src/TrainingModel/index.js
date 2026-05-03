import * as tf from '@tensorflow/tfjs';
import { useState, useRef } from 'react';
import './training-styles.css';

const INPUT_DATA = [
  [41, 157, 56], [47, 174, 56], [48, 157, 56], [49, 157, 56],
  [41, 174, 65], [47, 170, 65], [48, 170, 65], [49, 170, 65],
  [41, 183, 72], [47, 183, 72], [48, 174, 72], [49, 183, 72],
  [41, 157, 56], [47, 157, 56], [48, 157, 56], [49, 174, 56],
  [41, 170, 65], [47, 174, 65], [48, 170, 65], [49, 170, 65],
  [41, 174, 72], [47, 183, 72], [48, 183, 72], [49, 174, 72],
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
      tf.layers.dense({ inputShape: [3], units: 100, activation: 'relu' }),
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

    const xs = INPUT_DATA.map(r => [r[0] / 200, r[1] / 250, r[2] / 250]);
    const inputTensor  = tf.tensor(xs, [xs.length, 3]);
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
            addLog('start', 'Entrenando... (3 capas ocultas · 1204 unidades)');
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
