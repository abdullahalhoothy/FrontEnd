import mapboxgl from 'mapbox-gl';

export class ZoomControl implements mapboxgl.IControl {
  private map?: mapboxgl.Map;
  private container?: HTMLDivElement;

  onAdd(map: mapboxgl.Map) {
    console.log('ZoomControl: onAdd called');
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    const button = document.createElement('button');
    button.className = 'mapboxgl-ctrl-icon';
    button.type = 'button';
    button.setAttribute('aria-label', 'Zoom to World');
    button.style.display = 'block';
    button.style.padding = '5px';

    // Simple globe icon
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" style="display: block; margin: auto;">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
      </svg>
    `;

    button.addEventListener('click', () => {
      // Zoom to world bounds
      this.map?.fitBounds([
        [-180, -85], // southwestern corner
        [180, 85]    // northeastern corner
      ], {
        padding: 50,
        duration: 2000
      });
    });

    this.container.appendChild(button);
    console.log('ZoomControl: container created:', this.container);
    return this.container;
  }

  onRemove() {
    this.container?.remove();
    this.map = undefined;
  }
} 