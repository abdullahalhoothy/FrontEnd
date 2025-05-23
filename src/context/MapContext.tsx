import {
  createContext,
  useContext,
  useRef,
  ReactNode,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { MapContextType } from '../types/allTypesAndInterfaces';
import { zoomToGridSize, getMapScale, mapToBackendZoom } from '../utils/mapZoomUtils';
import { defaultMapConfig } from '../hooks/map/useMapInitialization';
import debounce from 'lodash/debounce';

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [mapState, setMapState] = useState({
    isStyleLoaded: false,
    currentZoom: defaultMapConfig.zoom,
    backendZoom: defaultMapConfig.zoomLevel,
    gridSize: defaultMapConfig.gridSize,
  });

  const handleZoomChange = useCallback(
    debounce(() => {
      if (!mapRef.current) return;

      const scaleInfo = getMapScale(mapRef.current);
      const mapboxZoom = mapRef.current.getZoom();
      // const backendZoom = mapMetersPerPixelToZoom(Math.floor(scaleInfo.metersPerPixel));
      const backendZoom = mapToBackendZoom(Math.floor(mapboxZoom));
      const hadZoomed = Math.floor(mapboxZoom) !== Math.floor(mapState.currentZoom);
      const newGridSize = zoomToGridSize(backendZoom);

      setMapState(prevState => {
        const newState = {
          ...prevState,
          currentZoom: Math.floor(hadZoomed ? mapboxZoom : prevState.currentZoom),
          backendZoom: backendZoom,
          gridSize: newGridSize,
        };
        return newState;
      });
    }, 200),
    [mapState.currentZoom]
  );

  console.log('mapState', mapState);

  useEffect(() => {
    return () => {
      handleZoomChange.cancel();
    };
  }, [handleZoomChange]);

  // Ensure zoom handler is properly attached
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapState.isStyleLoaded) return;

    map.dragRotate.disable();

    const onZoom = () => {
      handleZoomChange();
    };

    map.on('zoom', onZoom);
    return () => {
      map.off('zoom', onZoom);
    };
  }, [mapState.isStyleLoaded, handleZoomChange]);

  const contextValue = useMemo(
    () => ({
      mapRef,
      mapContainerRef,
      drawRef,
      isStyleLoaded: mapState.isStyleLoaded,
      setIsStyleLoaded: (loaded: boolean) =>
        setMapState(prev => ({ ...prev, isStyleLoaded: loaded })),
      currentZoom: mapState.currentZoom,
      backendZoom: mapState.backendZoom,
      gridSize: mapState.gridSize,
      shouldInitializeFeatures: mapState.isStyleLoaded && mapRef.current !== null,
    }),
    [mapState]
  );

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>;
}

// Custom hook with error boundary
export function useMapContext() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}
