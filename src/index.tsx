
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// --- SAFARI / EXTENSION CRASH FIX ---
// This overrides the native DOM methods to prevent React from crashing when 
// browser extensions (Google Translate, Grammarly, etc.) modify the DOM externally.
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      // Quietly handle extension interference without console spam
      // console.debug('[SMM Auto-Fix] Preventing removeChild on detached node'); 
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // Quietly handle extension interference without console spam
      // console.debug('[SMM Auto-Fix] Preventing insertBefore on detached node');
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any) as T;
  };
}
// ------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
