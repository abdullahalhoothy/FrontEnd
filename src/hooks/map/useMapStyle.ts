import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useCatalogContext } from '../../context/CatalogContext';
import { usePolygonsContext } from '../../context/PolygonsContext';
import { useMapContext } from '../../context/MapContext';
export function useMapStyle() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const map = mapRef.current;
  const { setGeoPoints } = useCatalogContext();
  const { currentStyle } = usePolygonsContext();

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

    const handleStyleLoad = () => {
      setGeoPoints(prevGeoPoints => prevGeoPoints.map(layer => ({ ...layer })));
    };

    map.once('styledata', handleStyleLoad);

    return () => {
      map?.off('styledata', handleStyleLoad);
    };
  }, [mapRef, currentStyle, shouldInitializeFeatures, setGeoPoints]);
}
