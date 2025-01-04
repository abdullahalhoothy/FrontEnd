import { MapFeatures } from "../../types/allTypesAndInterfaces";

function MapLegend(legendElement: HTMLDivElement, geoPoints: MapFeatures[]) {
  // Clear existing content
  legendElement.innerHTML = '';

  // Create legend header
  const header = document.createElement('div');
  header.className = 'p-2 border-b font-medium text-sm';
  header.textContent = 'Legend';
  legendElement.appendChild(header);

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

  legendElement.appendChild(content);
} 

export default MapLegend;