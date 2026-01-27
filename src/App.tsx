
import React from 'react';
import { BrowserRouter } from './components/ui/utils';
import { AuthProvider } from './context/AuthContext';
import { BasketProvider } from './context/BasketContext';
import { ToastProvider } from './components/ui';
import { AppContent } from './AppContent';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <BasketProvider>
             <AppContent />
          </BasketProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
