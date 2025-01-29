import zoomLevels from '../zoomLevels.json';
import gridSizeLevels from '../gridSizeLevels.json';
import distance from '@turf/distance';
import metersPerPixelRanges from '../metersPerPixelRanges.json';

/**
 * Maps a Mapbox zoom level to the backend zoom level
 * @param mapboxZoom - The current Mapbox zoom level
 * @returns The corresponding backend zoom_level, or null if not found
 */
export function mapToBackendZoom(mapboxZoom: number): number {
  const match = zoomLevels.find(
    ({ zoom_range }) => mapboxZoom >= zoom_range[0] && mapboxZoom <= zoom_range[1]
  );
  return match ? match.zoom_level : Math.floor(mapboxZoom);
}

/**
 * Maps a backend zoom level to a grid size
 * @param backendZoom - The backend zoom level
 * @returns The corresponding grid size, or null if not found
 */
export function zoomToGridSize(backendZoom: number): number {
  console.log("zoomToGridSize: received backendZoom: ",backendZoom);
  const index = backendZoom < 1 ? 1 : Math.min(backendZoom, 9);
  const matchingGridSize = Object.entries(gridSizeLevels).find(([key, value]) => Number(key) === index);
  return matchingGridSize ? Number(matchingGridSize[1]) : gridSizeLevels["6"];
}

/**
 * Get the current scale information from the map
 * @param map - Mapbox map instance
 * @returns Object containing scale information
 */
export function getMapScale(map: mapboxgl.Map) {
  const center = map.getCenter();
  const point = map.unproject([map.getContainer().offsetWidth / 2 + 100, map.getContainer().offsetHeight / 2]);
  
  // Calculate the distance between these points in meters
  const distanceInMeters = distance(
    [center.lng, center.lat],
    [point.lng, point.lat],
    { units: 'meters' }
  );

  return {
    metersPerPixel: distanceInMeters / 100,
    zoom: map.getZoom(),
    center: [center.lng, center.lat],
    bounds: map.getBounds(),
    distanceScale: {
      meters: distanceInMeters,
      kilometers: distanceInMeters / 1000
    }
  };
}

/**
 * Calculate the visible distance across the map viewport
 * @param map - Mapbox map instance
 * @returns Object containing viewport distances
 */
export function getViewportDistance(map: mapboxgl.Map) {
  const bounds = map.getBounds();
  const northeast = bounds.getNorthEast();
  const southwest = bounds.getSouthWest();
  
  // Calculate diagonal distance across viewport
  const diagonalDistance = distance(
    [southwest.lng, southwest.lat],
    [northeast.lng, northeast.lat],
    { units: 'kilometers' }
  );
  
  // Calculate width of viewport
  const widthDistance = distance(
    [southwest.lng, southwest.lat],
    [northeast.lng, southwest.lat],
    { units: 'kilometers' }
  );
  
  return {
    diagonal: diagonalDistance,
    width: widthDistance,
    bounds: {
      ne: [northeast.lng, northeast.lat],
      sw: [southwest.lng, southwest.lat]
    }
  };
}

/**
 * Maps meters per pixel to a zoom level
 * @param metersPerPixel - Current meters per pixel value
 * @returns The corresponding zoom_level, or 1 if not found
 */
export function mapMetersPerPixelToZoom(metersPerPixel: number): number {
  const zoomLevel = Object.entries(metersPerPixelRanges).find(
    ([_, range]) => metersPerPixel >= Number(range[1]) && metersPerPixel <= Number(range[0])
  );
  return zoomLevel ? Number(zoomLevel[0]) : 1;
}
