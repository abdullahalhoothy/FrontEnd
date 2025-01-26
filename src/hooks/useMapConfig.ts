import mapConfig from '../mapConfig.json';

export function useMapConfig() {
  return {
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    preserveDrawingBuffer: true,
    maxBounds: mapConfig.maxBounds,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
  };
}
