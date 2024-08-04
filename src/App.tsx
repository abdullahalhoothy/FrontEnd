
// src/App.tsx

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { CatalogProvider } from "./context/CatalogContext";
import { LayerProvider } from "./context/LayerContext";
import { UIProvider } from "./context/UIContext";
import CheckExtensions from "./components/CheckExtension/CheckExtensions";
import { AuthProvider } from './context/AuthContext';


const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
      <CatalogProvider>
        <LayerProvider>
          <UIProvider>
            <Layout />
            {/* <CheckExtensions /> */}
          </UIProvider>
        </LayerProvider>
      </CatalogProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;