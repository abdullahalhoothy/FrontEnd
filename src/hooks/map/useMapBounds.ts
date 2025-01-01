import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapFeatures } from '../../types/allTypesAndInterfaces';

export function useMapBounds(map: mapboxgl.Map | null, geoPoints: MapFeatures[]) {
  useEffect(() => {
    if (!map || !geoPoints.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    geoPoints.forEach(point => {
      if (point.display && point.features) {
        point.features.forEach(feature => {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        });
      }
    });

    map.fitBounds(bounds, { padding: 50 });
  }, [map, geoPoints]);
} 