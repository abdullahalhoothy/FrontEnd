import { BrowserRouter } from "react-router-dom";
import { CatalogProvider } from "./context/CatalogContext";
import { LayerProvider } from "./context/LayerContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import { UIProvider } from "./context/UIContext";
import NavigationSetup from "./components/NavigationSetup/NavigationSetup";
import { MapProvider } from "./context/MapContext";

function App() {
  return (
    <div className="flex w-screen h-svh">
      <BrowserRouter>
        <NavigationSetup>
          <AuthProvider>
            <MapProvider>
              <CatalogProvider>
                <LayerProvider>
                  <UIProvider>
                    <Layout />
                  </UIProvider>
                </LayerProvider>
              </CatalogProvider>
            </MapProvider>
          </AuthProvider>
        </NavigationSetup>
      </BrowserRouter>
    </div>
  );
}

export default App;
