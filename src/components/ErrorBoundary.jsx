import React from 'react';
import { MessageBar, MessageBarBody, Button } from '@fluentui/react-components';
import { DismissCircle24Regular } from '@fluentui/react-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 React Error Boundary capturó un fallo:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0e0e12',
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
          textAlign: 'center'
        }}>
          <DismissCircle24Regular style={{ fontSize: 60, color: '#f87171', marginBottom: '20px' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Vaya, algo salió mal</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '30px', maxWidth: '400px' }}>
            Un error inesperado ha detenido esta parte de la aplicación. No te preocupes, tus datos están a salvo.
          </p>
          
          <div style={{ marginBottom: '30px', width: '100%', maxWidth: '500px' }}>
            <MessageBar intent="error" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <MessageBarBody>
                {this.state.error?.message || 'Error desconocido'}
              </MessageBarBody>
            </MessageBar>
          </div>

          <Button 
            appearance="primary" 
            onClick={() => window.location.reload()}
            style={{ padding: '20px 40px' }}
          >
            Reiniciar Aplicación
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
