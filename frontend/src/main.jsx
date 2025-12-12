import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './store/store.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import App from './App.jsx';
import { Toaster } from './components/ui/toaster';

// Register Syncfusion license removed

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
