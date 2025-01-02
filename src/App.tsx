import { BrowserRouter } from "react-router-dom";
import { CatalogProvider } from "./context/CatalogContext";
import { LayerProvider } from "./context/LayerContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import { UIProvider } from "./context/UIContext";
import NavigationSetup from "./components/NavigationSetup/NavigationSetup";

function App() {
  return (
    <div className="flex w-screen h-svh">
      <BrowserRouter>
        <NavigationSetup>
          <AuthProvider>
            <CatalogProvider>
              <LayerProvider>
                <UIProvider>
                  <Layout />
                </UIProvider>
              </LayerProvider>
            </CatalogProvider>
          </AuthProvider>
        </NavigationSetup>
      </BrowserRouter>
    </div>
  );
}

export default App;
