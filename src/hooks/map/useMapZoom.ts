import { useEffect, useState } from 'react';
import { useMapContext } from '../../context/MapContext';
import { mapToBackendZoom } from '../../utils/mapZoomUtils';

export function useMapZoom() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const [currentZoom, setCurrentZoom] = useState<number | null>(null);
  const [backendZoom, setBackendZoom] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldInitializeFeatures || !mapRef.current) return;

    const map = mapRef.current;

    const handleZoomChange = () => {
      const mapboxZoom = map.getZoom();
      const mappedZoom = mapToBackendZoom(mapboxZoom);

      console.log('mapboxZoom -> mappedZoom', mapboxZoom, mappedZoom);
      
      setCurrentZoom(mapboxZoom);
      setBackendZoom(mappedZoom);
    };

    // Get initial zoom level
    handleZoomChange();

    // Add zoom event listener
    map.on('zoom', handleZoomChange);

    return () => {
      map.off('zoom', handleZoomChange);
    };
  }, [mapRef, shouldInitializeFeatures]);

  return { currentZoom, backendZoom };
} 