import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapFeatures } from '../../types/allTypesAndInterfaces';

export function useMapStyle(
  map: mapboxgl.Map | null,
  currentStyle: string,
  setGeoPoints: (updater: (prev: MapFeatures[]) => MapFeatures[]) => void
) {
  useEffect(() => {
    if (!map) return;

    const handleStyleLoad = () => {
      setGeoPoints(prevGeoPoints => 
        prevGeoPoints.map(layer => ({ ...layer }))
      );
    };

    map.once('styledata', handleStyleLoad);

    return () => {
      map?.off('styledata', handleStyleLoad);
    };
  }, [map, currentStyle, setGeoPoints]);
} 