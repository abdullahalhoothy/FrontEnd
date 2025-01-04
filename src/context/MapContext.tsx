import { createContext, useContext, useRef, ReactNode, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { MapContextType } from '../types/allTypesAndInterfaces';

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  const shouldInitializeFeatures = useMemo(() => {
    return isStyleLoaded && mapRef.current !== null;
  }, [isStyleLoaded, mapRef]);

  return (
    <MapContext.Provider 
      value={{ 
        mapRef, 
        mapContainerRef, 
        drawRef,
        isStyleLoaded,
        setIsStyleLoaded,
        shouldInitializeFeatures
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
} 