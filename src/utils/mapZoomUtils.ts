import zoomLevels from '../zoomLevels.json';

/**
 * Maps a Mapbox zoom level to the backend zoom level
 * @param mapboxZoom - The current Mapbox zoom level
 * @returns The corresponding backend zoom_level, or null if not found
 */
export function mapToBackendZoom(mapboxZoom: number): number | null {
  const match = zoomLevels.find(
    ({ zoom_range }) => mapboxZoom >= zoom_range[0] && mapboxZoom <= zoom_range[1]
  );
  return match ? match.zoom_level : null;
}

/**
 * Gets the zoom range for a specific backend zoom level
 * @param backendZoom - The backend zoom level
 * @returns The corresponding zoom range, or null if not found
 */
export function getZoomRange(backendZoom: number): [number, number] | null {
  const match = zoomLevels.find(({ zoom_level }) => zoom_level === backendZoom);
  return match ? match.zoom_range : null;
}
