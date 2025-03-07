import { useEffect, MutableRefObject, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import mapConfig from '../../mapConfig.json';
import { usePolygonsContext } from '../../context/PolygonsContext';
import { useMapContext } from '../../context/MapContext';
import { useCatalogContext } from '../../context/CatalogContext';
// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

export function useMapInitialization() {
  const { currentStyle } = usePolygonsContext();
  const { geoPoints } = useCatalogContext();
  const { mapRef, mapContainerRef, isStyleLoaded, setIsStyleLoaded } = useMapContext();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    // Initialize RTL plugin if needed
    if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        (): void => {},
        true
      );
    }
    // Calculate center point of all features
    let sumLng = 0;
    let sumLat = 0;
    let pointCount = 0;

    geoPoints.forEach(point => {
      if (point.display && point.features) {
        point.features.forEach(feature => {
          const coords = feature.geometry.coordinates as [number, number];
          sumLng += coords[0];
          sumLat += coords[1];
          pointCount++;
        });
      }
    });

    const hasPoints = pointCount > 0;
    const centerLng = hasPoints ? sumLng / pointCount : mapConfig.center[0];
    const centerLat = hasPoints ? sumLat / pointCount : mapConfig.center[1];

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: currentStyle,
      center: [centerLng, centerLat],
      attributionControl: true,
      zoom: mapConfig.zoom,
      preserveDrawingBuffer: true,
    });

    mapRef.current.on('style.load', () => {
      setIsStyleLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsStyleLoaded(false);
      }
    };
  }, [currentStyle, mapContainerRef]);

  return isStyleLoaded;
}

export const defaultMapConfig = mapConfig;
