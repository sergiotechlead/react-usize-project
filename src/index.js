import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App/App';
import reportWebVitals from './index/reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { ModelProvider } from './context/ModelContext';
import './App/files/styles-product.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ModelProvider>
        <App />
      </ModelProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
