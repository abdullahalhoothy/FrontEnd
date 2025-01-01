import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapFeatures } from '../../types/allTypesAndInterfaces';
import { addLayerToMap, removeLayerFromMap } from './mapLayerUtils';

interface MapLayersProps {
  map: mapboxgl.Map;
  geoPoints: MapFeatures[];
  reqFetchDataset: any;
}

export default function MapLayers({ map, geoPoints, reqFetchDataset }: MapLayersProps) {
  useEffect(() => {
    if (!map) return;

    // Remove existing layers
    const existingLayers = map.getStyle()?.layers || [];
    existingLayers.forEach(layer => {
      if (layer.id.startsWith('circle-layer-')) {
        removeLayerFromMap(map, layer.id);
      }
    });

    // Add new layers
    geoPoints.forEach((featureCollection, index) => {
      if (!featureCollection.display) return;
      addLayerToMap(map, featureCollection, index);
    });
  }, [map, geoPoints]);

  return null;
} 