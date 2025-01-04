import { useEffect, useRef } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';
import MapLegend from '../../components/Map/MapLegend';

export function useLegendManager() {
  const { geoPoints } = useCatalogContext()
  const { shouldInitializeFeatures } = useMapContext();
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!shouldInitializeFeatures) return;

    if (!legendRef.current) {
      legendRef.current = document.createElement("div");
      legendRef.current.className = "absolute bottom-[10px] right-[10px] z-10 bg-white border shadow min-w-[200px] rounded-md overflow-y-auto max-h-[calc(100vh-200px)]";
    }
  }, [shouldInitializeFeatures]);

  useEffect(() => {
    if (!shouldInitializeFeatures || !legendRef.current || !geoPoints.length) return;

    const hasAtLeastOneValidName = geoPoints.some(point => 
      point.layer_legend || (point.is_gradient && point.gradient_groups)
    );
    
    if (!hasAtLeastOneValidName) {
      legendRef.current.remove();
      return;
    }

    // Update legend content
    MapLegend(legendRef.current, geoPoints);

    return () => {
      legendRef.current?.remove();
    };
  }, [geoPoints]);

  if (legendRef.current) {
    document.body.appendChild(legendRef.current);
  };
}