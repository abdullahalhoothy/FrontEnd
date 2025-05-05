import { BrowserRouter } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext';
import { LayerProvider } from './context/LayerContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import { UIProvider } from './context/UIContext';
import NavigationSetup from './components/NavigationSetup/NavigationSetup';
import { MapProvider } from './context/MapContext';
import { Toaster } from 'sonner';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <div className="flex w-screen h-svh">
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <NavigationSetup>
          <AuthProvider>
            <MapProvider>
              <CatalogProvider>
                <LayerProvider>
                  <UIProvider>
                    <ChatProvider>
                      <Layout />
                    </ChatProvider>
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
