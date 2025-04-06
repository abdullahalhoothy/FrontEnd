import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalogContext } from './CatalogContext';
import * as turf from '@turf/turf';
import {
  PolygonFeature,
  Benchmark,
  Section,
  PolygonData,
  GeoPoint,
  PolygonContextType,
  ProviderProps,
} from '../types/allTypesAndInterfaces';
import excludedPropertiesJson from '../pages/MapContainer/excludedProperties.json';

const PolygonsContext = createContext<PolygonContextType>({} as PolygonContextType);

export const usePolygonsContext = (): PolygonContextType => {
  const context = useContext(PolygonsContext);
  if (!context) {
    throw new Error('usePolygonsContext must be used within a PolygonsProvider');
  }
  return context;
};

const PolygonsProvider = ({ children }: ProviderProps) => {
  const { geoPoints } = useCatalogContext();
  const [polygons, setPolygons] = useState<PolygonFeature[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [isBenchmarkControlOpen, setIsBenchmarkControlOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('mapbox://styles/mapbox/streets-v11');

  const sections = useMemo(() => {
    if (!Array.isArray(polygons) || !Array.isArray(geoPoints)) {
      return [] as Section[];
    }

    const excludedProperties = new Set(excludedPropertiesJson?.excludedProperties || []);

    const getPolygonShape = (coordinates: any[], type: string) => {
      if (type === 'MultiPolygon') {
        return coordinates.map(circle => {
          const ring = circle[0];
          if (
            ring.length < 4 ||
            !turf.booleanEqual(turf.point(ring[0]), turf.point(ring[ring.length - 1]))
          ) {
            ring.push(ring[0]); // Ensure closed ring
          }
          return turf.polygon(circle);
        });
      } else if (type === 'Polygon') {
        const ring = coordinates[0];
        if (
          ring.length < 4 ||
          !turf.booleanEqual(turf.point(ring[0]), turf.point(ring[ring.length - 1]))
        ) {
          ring.push(ring[0]); // Ensure closed ring
        }
        return [turf.polygon([ring])];
      }
      return [];
    };

    const processedPolygons: PolygonData[] = polygons.map(polygon => {
      if (!polygon.geometry?.coordinates) {
        return { polygon, sections: [], areas: [] };
      }

      const polygonData: PolygonData = {
        polygon,
        sections: [],
        areas: polygon.properties.shape === 'circle' ? ['1KM', '3KM', '5KM'] : ['Unknown'],
      };

      const polygonShapes = getPolygonShape(polygon.geometry.coordinates, polygon.geometry.type);
      const sectionsMap = new Map();
      const previouslyMatchedPoints = new Set();

      geoPoints.forEach((geoPoint: GeoPoint) => {
        const totalFeatures = geoPoint.features?.length || 0;

        polygonShapes.forEach((polygonShape, index) => {
          const areaName = polygonData.areas[index];
          const matchingFeatures =
            geoPoint.features?.filter(feature => {
              if (!feature.geometry?.coordinates || !Array.isArray(feature.geometry.coordinates)) {
                console.error('Invalid coordinates found:', feature.geometry?.coordinates);
                return false;
              }

              const featureCoords = JSON.stringify(feature.geometry.coordinates);
              if (previouslyMatchedPoints.has(featureCoords)) return false;

              try {
                // Handling different geometry types
                let point;
                if (feature.geometry.type === 'Point') {
                  // Standard point format [lng, lat]
                  point = turf.point(feature.geometry.coordinates);
                } else if (feature.geometry.type === 'Polygon') {
                  // For polygons, we are using the first coordinate of the first ring
                  if (
                    Array.isArray(feature.geometry.coordinates[0]) &&
                    Array.isArray(feature.geometry.coordinates[0][0])
                  ) {
                    point = turf.point(feature.geometry.coordinates[0][0]);
                  } else {
                    console.error(
                      'Invalid polygon coordinates structure:',
                      feature.geometry.coordinates
                    );
                    return false;
                  }
                } else {
                  // Extracting coordinates based on the structure
                  let coords;
                  if (Array.isArray(feature.geometry.coordinates[0])) {
                    if (Array.isArray(feature.geometry.coordinates[0][0])) {
                      // Nested array like [[[x,y],[x,y]]]
                      coords = feature.geometry.coordinates[0][0];
                    } else {
                      // Array like [[x,y]]
                      coords = feature.geometry.coordinates[0];
                    }
                  } else {
                    // Simple array like [x,y]
                    coords = feature.geometry.coordinates;
                  }

                  if (!Array.isArray(coords) || coords.length < 2) {
                    console.error('Could not extract valid coordinates:', coords);
                    return false;
                  }

                  point = turf.point(coords);
                }

                const isInPolygon = turf.booleanPointInPolygon(point, polygonShape);

                if (isInPolygon) {
                  previouslyMatchedPoints.add(featureCoords);
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error processing feature:', error.message);
                console.error('Problematic coordinates:', feature.geometry?.coordinates);
                console.error('Feature type:', feature.geometry?.type);
                return false;
              }
            }) || [];
          console.log(`Found ${matchingFeatures.length} matching features for area ${areaName}`);

          matchingFeatures.forEach(feature => {
            Object.entries(feature.properties).forEach(([key, val]) => {
              if (!excludedProperties.has(key)) {
                const numVal = Number(val);
                if (val !== '' && !isNaN(numVal)) {
                  if (!sectionsMap.has(key)) {
                    sectionsMap.set(key, new Map());
                  }
                  const layerMap = sectionsMap.get(key);
                  if (!layerMap.has(geoPoint.prdcer_layer_name)) {
                    layerMap.set(geoPoint.prdcer_layer_name, new Map());
                  }
                  const areaMap = layerMap.get(geoPoint.prdcer_layer_name);
                  if (!areaMap.has(areaName)) {
                    areaMap.set(areaName, { sum: 0, count: 0 });
                  }
                  const areaData = areaMap.get(areaName);
                  areaData.sum += numVal;
                  areaData.count += 1;
                }
              }
            });
          });
        });
      });

      polygonData.sections = Array.from(sectionsMap, ([title, layerMap]) => ({
        title,
        points: Array.from(layerMap, ([layer_name, areaMap]) => ({
          layer_name,
          data: polygonData.areas.map(area => {
            const areaData = areaMap.get(area) || { sum: 0, count: 0 };
            return {
              count: areaData.count,
              sum: areaData.sum,
              percentage: parseFloat(
                (
                  (areaData.count /
                    (geoPoints.find((gp: GeoPoint) => gp.prdcer_layer_name === layer_name)?.features
                      ?.length || 1)) *
                  100
                ).toFixed(1)
              ),
              avg: areaData.count ? parseFloat(areaData.sum / areaData.count).toFixed(2) : '-',
              area,
            };
          }),
        })),
      }));

      return polygonData;
    });

    return processedPolygons;
  }, [polygons, geoPoints]);

  useEffect(() => {
    const newBenchmarks: Benchmark[] = [];

    // Get unique properties from all layers
    const properties = new Set<string>();
    geoPoints.forEach(layer => {
      layer.features?.forEach(feature => {
        Object.entries(feature.properties).forEach(([key, val]) => {
          // Only add numeric properties
          if (typeof val === 'number' || !isNaN(Number(val))) {
            properties.add(key);
          }
        });
      });
    });

    // Create benchmarks for each numeric property
    properties.forEach(property => {
      if (!benchmarks.some(b => b.title === property)) {
        newBenchmarks.push({
          title: property,
          value: '',
        });
      }
    });

    if (newBenchmarks.length > 0) {
      setBenchmarks(prev => [...prev, ...newBenchmarks]);
    }
  }, [geoPoints]);

  return (
    <PolygonsContext.Provider
      value={{
        polygons,
        setPolygons,
        sections,
        benchmarks,
        setBenchmarks,
        isBenchmarkControlOpen,
        setIsBenchmarkControlOpen,
        currentStyle,
        setCurrentStyle,
      }}
    >
      {children}
    </PolygonsContext.Provider>
  );
};

export default PolygonsProvider;

export function calculatePolygonStats(polygon: any, geoPoints: any[]) {
  // Process points within polygon
  const pointsWithin = geoPoints.map(layer => {
    console.log(
      `Processing layer in calculatePolygonStats: ${layer.prdcer_layer_name || 'unnamed'}`
    );
    console.log(`Layer has ${layer.features?.length || 0} features`);

    const matchingPoints = layer.features.filter(point => {
      try {
        // Check if coordinates exist
        if (!point.geometry?.coordinates || !Array.isArray(point.geometry.coordinates)) {
          console.error('Invalid point coordinates:', point.geometry?.coordinates);
          return false;
        }

        // Handle different geometry types and coordinate structures
        let turfPoint;
        if (point.geometry.type === 'Point') {
          // Standard point format [lng, lat]
          turfPoint = turf.point(point.geometry.coordinates);
        } else if (point.geometry.type === 'Polygon') {
          // For polygons, use the first coordinate of the first ring
          if (
            Array.isArray(point.geometry.coordinates[0]) &&
            Array.isArray(point.geometry.coordinates[0][0])
          ) {
            turfPoint = turf.point(point.geometry.coordinates[0][0]);
          } else {
            console.error('Invalid polygon coordinates structure:', point.geometry.coordinates);
            return false;
          }
        } else {
          // Extract coordinates based on the structure
          let coords;
          if (Array.isArray(point.geometry.coordinates[0])) {
            if (Array.isArray(point.geometry.coordinates[0][0])) {
              // Nested array like [[[x,y],[x,y]]]
              coords = point.geometry.coordinates[0][0];
            } else {
              // Array like [[x,y]]
              coords = point.geometry.coordinates[0];
            }
          } else {
            // Simple array like [x,y]
            coords = point.geometry.coordinates;
          }

          if (!Array.isArray(coords) || coords.length < 2) {
            console.error('Could not extract valid coordinates:', coords);
            return false;
          }

          turfPoint = turf.point(coords);
        }

        return turf.booleanPointInPolygon(turfPoint, polygon);
      } catch (error) {
        console.error('Error in point-in-polygon check:', error.message);
        console.error('Problematic point geometry:', point.geometry);
        return false;
      }
    });

    return {
      title: layer.layer_legend || layer.prdcer_layer_name,
      count: matchingPoints.length,
      percentage: ((matchingPoints.length / layer.features.length) * 100).toFixed(1),
    };
  });

  return pointsWithin;
}
