import * as turf from '@turf/turf';
import _ from 'lodash';
import { Feature, Polygon, MultiPolygon } from 'geojson';

const abbreviateBasedOn = (basedon: string) =>
  'population' === basedon.toLowerCase().trim() ? 'PCNT' : basedon;

self.onmessage = async event => {
  const { featureCollection } = event.data;

  try {
    // Process each polygon feature
    const processedFeatures = featureCollection.features.map(
      (feature: Feature<Polygon | MultiPolygon>, index: number) => {
        try {
          const density =
            featureCollection.basedon?.length > 0
              ? (() => {
                  const value = feature.properties?.[abbreviateBasedOn(featureCollection.basedon)];
                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                  return typeof numValue === 'number' && !isNaN(numValue) ? numValue : 0;
                })()
              : 1; // Default density of 1 for each polygon

          // Calculate center of the polygon
          const center = turf.center(feature);
          const centerCoords = center.geometry.coordinates;

          if (
            !Array.isArray(centerCoords) ||
            centerCoords.length !== 2 ||
            typeof centerCoords[0] !== 'number' ||
            typeof centerCoords[1] !== 'number'
          ) {
            console.error('Invalid center coordinates:', {
              feature: index,
              coords: centerCoords,
              geometry: feature.geometry,
            });
            return feature;
          }

          const center_obj = {
            lng: Number(centerCoords[0]),
            lat: Number(centerCoords[1]),
          };

          // Calculate area of the polygon
          const area = turf.area(feature);

          return {
            ...feature,
            id: index,
            properties: {
              ...feature.properties,
              density,
              center: center_obj,
              area: _.round(area, 2),
            },
          };
        } catch (error) {
          console.error(`Error processing polygon ${index}:`, error);
          return feature;
        }
      }
    );

    (self as any).postMessage({
      features: processedFeatures,
      type: 'FeatureCollection',
    });
  } catch (error) {
    console.error('Worker error:', error);
    (self as any).postMessage({
      error: error.message,
      details: {
        featureCollectionValid: !!featureCollection?.features,
      },
    });
  }
};
