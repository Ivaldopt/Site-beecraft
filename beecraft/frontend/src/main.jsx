import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import '@fontsource-variable/inter';
import './styles/global.css';
import CookieBanner from './consent/CookieBanner.jsx';
import { startTrackers } from './consent/trackers.js';

startTrackers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
        <CookieBanner />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
);
