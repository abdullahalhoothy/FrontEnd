import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Layout from "./components/Layout/VertiSideBar";
import { CatalogProvider } from "./context/CatalogContext";
import { LayerProvider } from "./context/LayerContext";
import { UIProvider } from "./context/UIContext";
import CheckExtensions from "./components/CheckExtension/CheckExtensions";

const App: React.FC = () => {
  return (
    <Router>
      <CatalogProvider>
        <LayerProvider>
          <UIProvider>
            <Layout />
            <CheckExtensions />
          </UIProvider>
        </LayerProvider>
      </CatalogProvider>
    </Router>
  );
};

export default App;