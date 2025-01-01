import mapboxgl from 'mapbox-gl';
import { MapFeatures } from '../../types/allTypesAndInterfaces';

function addAppropriateLayer(
  map: mapboxgl.Map, 
  featureCollection: MapFeatures, 
  layerId: string, 
  sourceId: string
) {
  const layerConfig = {
    id: layerId,
    source: sourceId,
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': featureCollection.points_color || '#28A745',
      'circle-opacity': 0.7
    }
  };

  map.addLayer(layerConfig as any);
}

export function addLayerToMap(map: mapboxgl.Map, featureCollection: MapFeatures, index: number) {
  const sourceId = `circle-source-${index}`;
  const layerId = `circle-layer-${index}`;

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: featureCollection,
      generateId: true
    });
  }

  addAppropriateLayer(map, featureCollection, layerId, sourceId);
}

export function removeLayerFromMap(map: mapboxgl.Map, layerId: string) {
  const sourceId = `circle-source-${layerId.split('-')[2]}`;
  
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
} 