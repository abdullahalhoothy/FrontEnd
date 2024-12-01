import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CatalogProvider } from "./context/CatalogContext";
import { LayerProvider } from "./context/LayerContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import { UIProvider } from "./context/UIContext";

function App() {
  return (
    <div className="flex w-screen h-svh">
      <BrowserRouter>
        <AuthProvider>
          <CatalogProvider>
            <LayerProvider>
              <UIProvider>
                <Layout />
              </UIProvider>
            </LayerProvider>
          </CatalogProvider>
        </AuthProvider>
      </BrowserRouter>
    </div >
  );
}

export default App;
