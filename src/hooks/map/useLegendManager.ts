import { useEffect, useRef } from 'react';
import { MapFeatures } from '../../types/allTypesAndInterfaces';
import mapConfig from '../../mapConfig.json';

export function useLegendManager(geoPoints: MapFeatures[]) {
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!legendRef.current) {
      legendRef.current = document.createElement("div");
      legendRef.current.className = "absolute bottom-[10px] right-[10px] z-10 bg-white border shadow min-w-[200px] rounded-md overflow-y-auto max-h-[calc(100vh-200px)]";
    }
  }, []);

  useEffect(() => {
    if (!legendRef.current || !geoPoints.length) return;

    const hasAtLeastOneValidName = geoPoints.some(point => 
      point.layer_legend || (point.is_gradient && point.gradient_groups)
    );
    
    if (!hasAtLeastOneValidName) {
      legendRef.current.remove();
      return;
    }

    // Update legend content
    updateLegendContent(legendRef.current, geoPoints);

    return () => {
      legendRef.current?.remove();
    };
  }, [geoPoints]);

  return legendRef;
}

function updateLegendContent(legendElement: HTMLDivElement, geoPoints: MapFeatures[]) {
  // Legend update logic here (moved from the component)
  legendElement.innerHTML = `<h4 class="text-sm font-semibold text-gray-900 border-b p-2">Legend</h4>`;
  // ... rest of the legend update logic
} 