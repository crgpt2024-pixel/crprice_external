import React from 'react';
import { createRoot } from 'react-dom/client';
import Gate from './Gate';
import EstimateApp from './EstimateApp';

createRoot(document.getElementById('root')!).render(
  <Gate>
    <EstimateApp />
  </Gate>,
);
