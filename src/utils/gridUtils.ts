/**
 * Generates HTML content for grid popup
 */
export function generateGridPopupContent(properties: Record<string, number>): string | null {
  if (!properties || Object.keys(properties).length === 0 || Number(properties.pointCount) === 0) {
    console.log('No data for this cell');
    return null;
  }

  // Start popup content
  let content = '<div class="popup-content">';
  content += '<div class="grid-popup-body">';

  console.log({ properties });
  // Loop through properties and display them
  Object.entries(properties)
    .filter(([key]) => !['density', 'center', 'pointCount'].includes(key)) // Exclude internal properties
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Format the label
        const label = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // Format the value
        const displayValue =
          typeof value === 'number'
            ? Number.isInteger(value)
              ? value
              : Number(value.toFixed(2))
            : value;

        content += `
          <div class="grid-popup-row">
            <span class="grid-popup-label">${label}:</span>
            <span class="grid-popup-value">${displayValue}</span>
          </div>`;
      }
    });

  content += '</div></div>';
  return content;
}
