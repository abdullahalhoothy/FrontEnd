import { useEffect, useRef } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';
import MapLegend from '../../components/Map/MapLegend';

export function useLegendManager() {
  const { geoPoints } = useCatalogContext();
  const { shouldInitializeFeatures } = useMapContext();
  const legendRef = useRef<HTMLDivElement | null>(null);

  // Effect to create legend element
  useEffect(() => {
    if (!shouldInitializeFeatures) return;

    if (!legendRef.current) {
      legendRef.current = document.createElement('div');
      legendRef.current.className =
        'absolute bottom-[10px] right-[10px] z-10 bg-white border shadow min-w-[200px] rounded-md overflow-y-auto max-h-[calc(100vh-200px)]';
    }
  }, [shouldInitializeFeatures]);

  // Effect to manage legend content and visibility
  useEffect(() => {
    // Clean up any existing legend
    if (legendRef.current) {
      legendRef.current.remove();
    }

    // Only proceed if we should show the legend
    if (!shouldInitializeFeatures || !geoPoints.length) {
      return;
    }

    const hasAtLeastOneValidName = geoPoints.some(
      point => point.display && (point.layer_legend || (point.is_gradient && point.gradient_groups))
    );

    if (!hasAtLeastOneValidName) {
      return;
    }

    // Create and update legend
    if (legendRef.current) {
      MapLegend(legendRef.current, geoPoints);
      document.body.appendChild(legendRef.current);
    }

    return () => {
      legendRef.current?.remove();
    };
  }, [geoPoints, shouldInitializeFeatures]);
}
