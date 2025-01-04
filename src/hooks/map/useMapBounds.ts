import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';

export function useMapBounds() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const { geoPoints } = useCatalogContext();

  useEffect(() => {
    if (!shouldInitializeFeatures) return;

    const map = mapRef.current;
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
  }, [mapRef, geoPoints]);
} 