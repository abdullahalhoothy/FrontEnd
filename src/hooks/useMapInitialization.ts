import { useEffect, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapConfig } from './useMapConfig';

export function useMapInitialization(
  mapRef: MutableRefObject<mapboxgl.Map | null>,
  mapContainerRef: MutableRefObject<HTMLDivElement | null>,
  currentStyle: string
) {
  const config = useMapConfig();

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: currentStyle,
        ...config
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentStyle]);
} 