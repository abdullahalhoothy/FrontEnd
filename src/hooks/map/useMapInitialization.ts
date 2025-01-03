import { useEffect, MutableRefObject, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import mapConfig from '../../mapConfig.json';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

export function useMapInitialization(
  mapRef: MutableRefObject<mapboxgl.Map | null>,
  mapContainerRef: MutableRefObject<HTMLDivElement | null>,
  currentStyle: string
) {
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  useEffect(() => {
    console.log('useMapInitialization: Effect triggered')
    if (!mapContainerRef.current || mapRef.current) {
      console.log('useMapInitialization: Early return - container:', !!mapContainerRef.current, 'existing map:', !!mapRef.current)
      return
    }

    // Initialize RTL plugin if needed
    if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        (): void => {},
        true
      );
    }

    // Initialize map
    console.log('useMapInitialization: Creating new map instance')
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: currentStyle,
      center: mapConfig.center as [number, number],
      attributionControl: true,
      zoom: mapConfig.zoom,
      preserveDrawingBuffer: true
    });

    mapRef.current.on('style.load', () => {
      console.log('useMapInitialization: Style loaded')
      setIsStyleLoaded(true);
    });

    console.log('useMapInitialization: Map instance created')

    return () => {
      console.log('useMapInitialization: Cleanup triggered')
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsStyleLoaded(false);
        console.log('useMapInitialization: Map instance removed')
      }
    };
  }, [currentStyle, mapContainerRef]);

  return isStyleLoaded;
} 