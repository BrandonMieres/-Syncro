import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webDarkTheme } from '@fluentui/react-components';
import App from './App';
import './styles/globals.css';
import './styles/glass.css';

import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FluentProvider
        theme={webDarkTheme}
        style={{ background: 'transparent', height: '100vh' }}
      >
        <App />
      </FluentProvider>
    </ErrorBoundary>
  </React.StrictMode>
);