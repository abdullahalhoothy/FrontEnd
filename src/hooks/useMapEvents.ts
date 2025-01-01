import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapFeatures } from '../types/allTypesAndInterfaces';

export function useMapEvents(map: mapboxgl.Map | null, geoPoints: MapFeatures[]) {
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!map) return;
    
    const features = map.queryRenderedFeatures(e.point, {
      layers: geoPoints.map((_, index) => `circle-layer-${index}`)
    });

    if (features.length) {
      const clickedFeature = features[0];
      // Handle feature click
      console.debug('Clicked feature:', clickedFeature);
    }
  }, [map, geoPoints]);

  const handleMapMove = useCallback(() => {
    if (!map) return;
    // Handle map movement
  }, [map]);

  const handleMapZoom = useCallback(() => {
    if (!map) return;
    // Handle zoom changes
  }, [map]);

  return {
    handleMapClick,
    handleMapMove,
    handleMapZoom
  };
} 