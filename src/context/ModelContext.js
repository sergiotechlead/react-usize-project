import { createContext, useContext, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { trainModel, MODEL_KEY } from '../ml/modelConfig';

const ModelContext = createContext(null);

// status: 'checking' | 'initializing' | 'ready' | 'error'
export function ModelProvider({ children }) {
  const [modelStatus, setModelStatus] = useState('checking');

  useEffect(() => {
    async function init() {
      try {
        await tf.loadLayersModel(MODEL_KEY);
        setModelStatus('ready');
      } catch {
        setModelStatus('initializing');
        try {
          await trainModel({ epochs: 201 });
          setModelStatus('ready');
        } catch {
          setModelStatus('error');
        }
      }
    }
    init();
  }, []);

  function markDirty() {
    setModelStatus('initializing');
  }

  function markReady() {
    setModelStatus('ready');
  }

  return (
    <ModelContext.Provider value={{ modelStatus, markDirty, markReady }}>
      {children}
    </ModelContext.Provider>
  );
}

export const useModel = () => useContext(ModelContext);
