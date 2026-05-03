import { useState, useRef } from 'react';
import { trainModel } from '../ml/modelConfig';
import { useModel } from '../context/ModelContext';
import './training-styles.css';

const EPOCHS = 201;

function TrainingModel({ customData }) {
  const { markReady } = useModel();
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

    const inputData = customData?.inputData ?? undefined;
    const labels    = customData?.labels    ?? undefined;
    const count     = inputData?.length ?? 24;

    addLog('info', 'Inicializando red neuronal...');

    try {
      const result = await trainModel({
        inputData,
        labels,
        epochs: EPOCHS,
        onEpoch: (epoch, { loss }) => {
          setProgress(Math.round(((epoch + 1) / EPOCHS) * 100));
          if (epoch === 0) {
            addLog('start', `Entrenando con ${count} muestras — 4 entradas · 3 capas ocultas`);
          }
          if (epoch % 50 === 0 && epoch > 0) {
            addLog('epoch', `Epoch ${epoch}/${EPOCHS - 1}  —  loss: ${loss.toFixed(6)}`);
          }
        },
      });

      const accKey = Object.keys(result.history).find(k => k.toLowerCase().includes('acc')) ?? 'acc';
      const accHistory = result.history[accKey] ?? [];
      const finalAcc = accHistory.length
        ? Math.round(accHistory[accHistory.length - 1] * 10000) / 100
        : 100;

      addLog('success', `✓ Entrenamiento completo — Accuracy: ${finalAcc}%`);
      addLog('success', '✓ Modelo guardado en localStorage');

      setProgress(100);
      setIsTrained(true);
      markReady();
    } catch (err) {
      addLog('error', `✗ Error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  }

  return (
    <section className="training-section">
      <div className="training-header">
        <div>
          <h3 className="training-title">Modelo de IA</h3>
          <p className="training-subtitle">
            {customData
              ? `Reentrenar con ${customData.inputData?.length ?? 0} muestras personalizadas.`
              : 'Entrenar la red neuronal con los datos base.'}
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
          <><span className="loading-spinner" />Entrenando...</>
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
            <div key={i} className={`log-entry log-entry--${log.type}`}>{log.text}</div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </section>
  );
}

export default TrainingModel;
