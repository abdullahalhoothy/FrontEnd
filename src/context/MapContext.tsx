import { createContext, useContext, useRef, ReactNode, useState, useMemo, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { MapContextType } from '../types/allTypesAndInterfaces';
import { mapToBackendZoom } from '../utils/mapZoomUtils';
import { defaultMapConfig } from '../hooks/map/useMapInitialization';

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  
  const [mapState, setMapState] = useState({
    isStyleLoaded: false,
    currentZoom: defaultMapConfig.zoom,
    backendZoom: defaultMapConfig.zoomLevel,
    gridSize: defaultMapConfig.gridSize
  });

  const handleZoomChange = useCallback(() => {
    if (!mapRef.current) return;
    
    const mapboxZoom = mapRef.current.getZoom();
    const mappedZoom = mapToBackendZoom(mapboxZoom);
    const hadZoomedIn = mapboxZoom > mapState.currentZoom;
    const mapGridSize = mapState.gridSize * (hadZoomedIn ? 0.75 : 1.5);
        
    // Force state update
    setMapState(prevState => {
      if (mappedZoom === null) return prevState;
      const newState = {
        ...prevState,
        currentZoom: mapboxZoom,
        backendZoom: mappedZoom,
        gridSize: mapGridSize
      };
      return newState;
    });
  }, []);

  // Ensure zoom handler is properly attached
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapState.isStyleLoaded) return;
    
    const onZoom = () => {
      handleZoomChange();
    };

    map.on('zoom', onZoom);
    return () => {map.off('zoom', onZoom);}
  }, [mapState.isStyleLoaded, handleZoomChange]);

  const contextValue = useMemo(() => ({
    mapRef,
    mapContainerRef,
    drawRef,
    isStyleLoaded: mapState.isStyleLoaded,
    setIsStyleLoaded: (loaded: boolean) => 
      setMapState(prev => ({ ...prev, isStyleLoaded: loaded })),
    currentZoom: mapState.currentZoom,
    backendZoom: mapState.backendZoom,
    gridSize: mapState.gridSize,
    shouldInitializeFeatures: mapState.isStyleLoaded && mapRef.current !== null
  }), [mapState]);

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
}

// Custom hook with error boundary
export function useMapContext() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
} 