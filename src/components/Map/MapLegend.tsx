import { useEffect, useRef } from 'react';
import { MapLegendProps } from '../../types/allTypesAndInterfaces';


export default function MapLegend({ geoPoints }: MapLegendProps) {
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!legendRef.current) {
      legendRef.current = document.createElement("div");
      legendRef.current.className = "absolute bottom-[10px] right-[10px] z-10 bg-white border shadow min-w-[200px] rounded-md overflow-y-auto max-h-[calc(100vh-200px)]";
    }

    const updateLegendContent = () => {
      if (!legendRef.current) return;

      // Clear existing content
      legendRef.current.innerHTML = '';

      // Create legend header
      const header = document.createElement('div');
      header.className = 'p-2 border-b font-medium text-sm';
      header.textContent = 'Legend';
      legendRef.current.appendChild(header);

      // Create legend content
      const content = document.createElement('div');
      content.className = 'p-2';

      geoPoints.forEach(point => {
        if (!point.display) return;

        if (point.is_gradient && point.gradient_groups) {
          const groupDiv = document.createElement('div');
          groupDiv.className = 'mb-2';
          point.gradient_groups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-2 mb-1';
            item.innerHTML = `
              <div class="w-3 h-3 rounded-full" style="background-color: ${group.color}"></div>
              <span class="text-sm">${group.legend}</span>
            `;
            groupDiv.appendChild(item);
          });
          content.appendChild(groupDiv);
        } else if (point.layer_legend) {
          const item = document.createElement('div');
          item.className = 'flex items-center gap-2 mb-1';
          item.innerHTML = `
            <div class="w-3 h-3 rounded-full" style="background-color: ${point.points_color}"></div>
            <span class="text-sm">${point.layer_legend}</span>
          `;
          content.appendChild(item);
        }
      });

      legendRef.current.appendChild(content);
    };

    updateLegendContent();

    return () => {
      legendRef.current?.remove();
    };
  }, [geoPoints]);

  return null;
} 