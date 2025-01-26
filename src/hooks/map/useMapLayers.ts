import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { useCatalogContext } from '../../context/CatalogContext';
import { defaultMapConfig } from './useMapInitialization';
import { getDefaultLayerColor } from '../../utils/helperFunctions';
import * as turf from '@turf/turf';
import { useMapContext } from '../../context/MapContext';
import { generatePopupContent } from '../../pages/MapContainer/generatePopupContent';
import { CustomProperties } from '../../types/allTypesAndInterfaces';
import { useUIContext } from '../../context/UIContext';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import { useGridPopup } from './useGridPopup';
import { useGridInteraction } from './useGridInteraction';
import _ from 'lodash';
import { PropertyStats } from '../../types/allTypesAndInterfaces';
import { isIntelligentLayer } from '../../utils/layerUtils';
const USE_BASEDON = true;

const getGridPaint = (
  basedonLength: boolean,
  pointsColor: string,
  p25: number,
  p50: number,
  p75: number
) => ({
  'fill-color': pointsColor || defaultMapConfig.defaultColor,
  'fill-opacity': [
    'case',
    ['==', ['get', 'density'], 0],
    0,
    ['step', ['get', 'density'], 0.1, p25, 0.25, p50, 0.5, p75, 0.75],
  ],
  'fill-outline-color': ['case', ['==', ['get', 'density'], 0], 'rgba(0,0,0,0)', 'rgba(0,0,0,128)'],
});

const getHeatmapPaint = (basedon: string, pointsColor?: string) => ({
  'heatmap-weight': ['interpolate', ['linear'], ['get', basedon || 'heatmap_weight'], 0, 0, 5, 1],
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    'rgba(33,102,172,0)',
    0.2,
    pointsColor || defaultMapConfig.defaultColor,
    0.4,
    'rgb(209,229,240)',
    0.6,
    'rgb(253,219,199)',
    0.8,
    'rgb(239,138,98)',
    1,
    'rgb(178,24,43)',
  ],
});

const getCirclePaint = (pointsColor: string, layerId: number) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': pointsColor || getDefaultLayerColor(layerId),
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor,
});

const getGradientCirclePaint = (defaultColor: string) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': [
    'coalesce',
    ['get', 'gradient_color'], // Use gradient color if available
    defaultColor || defaultMapConfig.defaultColor, // Fallback to default
  ],
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor,
});

export function useMapLayers() {
  const { mapRef, shouldInitializeFeatures, gridSize } = useMapContext();
  const { isMobile } = useUIContext();
  const map = mapRef.current;
  const { geoPoints } = useCatalogContext();
  const [cityBounds, setCityBounds] = useState<Record<string, any>>({});

  // Add this ref
  const gridLayerIdRef = useRef<string | null>(null);

  // Track source and layer IDs for proper cleanup
  const layerStateRef = useRef<{
    sourceId: string | null;
    layerId: string | null;
    gridSourceId: string | null;
    gridLayerId: string | null;
  }>({
    sourceId: null,
    layerId: null,
    gridSourceId: null,
    gridLayerId: null,
  });

  // Initialize popup handlers first
  const { createGridPopup, cleanupGridPopup } = useGridPopup(map);

  // Then initialize grid handlers with the popup functions
  const { handleGridCellClick, cleanupGridSelection } = useGridInteraction(
    map,
    createGridPopup,
    cleanupGridPopup
  );

  // Enhanced cleanup helper with proper order
  const cleanupLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      // Clean up popups first
      cleanupGridPopup();

      const { gridLayerId, gridSourceId } = layerStateRef.current;

      // Remove button layer first
      if (gridLayerId && map.getLayer(`${gridLayerId}-buttons`)) {
        map.removeLayer(`${gridLayerId}-buttons`);
      }

      // Then remove grid layer
      if (gridLayerId && map.getLayer(gridLayerId)) {
        map.removeLayer(gridLayerId);
      }

      // Remove image
      if (map.hasImage('info-button')) {
        map.removeImage('info-button');
      }

      // Clean up grid selection state and refs
      cleanupGridSelection(layerStateRef.current.gridSourceId || '');
      gridLayerIdRef.current = null;

      const { layerId, sourceId } = layerStateRef.current;

      // Remove layers first
      if (layerId && map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }

      // Then remove sources
      if (gridSourceId && map.getSource(gridSourceId)) {
        map.removeSource(gridSourceId);
      }

      if (sourceId && map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Clear refs
      layerStateRef.current = {
        sourceId: null,
        layerId: null,
        gridSourceId: null,
        gridLayerId: null,
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [map, cleanupGridPopup, cleanupGridSelection]);

  useEffect(() => {
    const fetchCityBounds = async () => {
      try {
        const response = await apiRequest({
          url: urls.country_city,
          method: 'GET',
        });

        const boundsMap: Record<string, any> = {};
        Object.values(response.data.data)
          .flat()
          .forEach((city: any) => {
            boundsMap[city.name.toLowerCase()] = {
              // Format: [west, south, east, north]
              bounds: [
                city.borders.southwest.lng, // west (minX)
                city.borders.southwest.lat, // south (minY)
                city.borders.northeast.lng, // east (maxX)
                city.borders.northeast.lat, // north (maxY)
              ],
              center: [city.lng, city.lat],
            };
          });
        setCityBounds(boundsMap);
      } catch (error) {
        console.error('Error fetching city bounds:', error);
      }
    };

    fetchCityBounds();
  }, []);

  // Effect to add layers
  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

    const addLayers = () => {
      if (!map.isStyleLoaded()) {
        console.warn('Style not loaded, waiting...');
        return;
      }

      try {
        // Clean up existing layers first
        geoPoints.forEach((_, index) => {
          const layerId = `circle-layer-${index}`;
          const sourceId = `circle-source-${index}`;
          const gridLayerId = `${layerId}-grid`;
          const gridSourceId = `${sourceId}-grid`;

          try {
            if (map.getLayer(gridLayerId)) {
              map.removeLayer(gridLayerId);
            }
            if (map.getSource(gridSourceId)) {
              map.removeSource(gridSourceId);
            }
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          } catch (err) {
            console.warn('Non-fatal layer cleanup error:', err);
          }
        });

        // Clean up existing popups before adding new layers
        cleanupGridPopup();
        layerStateRef.current = {
          sourceId: null,
          layerId: null,
          gridSourceId: null,
          gridLayerId: null,
        };

        // Add new layers
        [...geoPoints].reverse()
        .sort((lyr_a, lyr_b) => {
          if (isIntelligentLayer(lyr_a) && !isIntelligentLayer(lyr_b)) return -1;
          if (!isIntelligentLayer(lyr_a) && isIntelligentLayer(lyr_b)) return 1;
          return 0;
        }).forEach((featureCollection, index) => {
          if (!featureCollection.type || !Array.isArray(featureCollection.features)) {
            console.error('🗺️ [Map] Invalid GeoJSON structure:', featureCollection);
            return;
          }

          const sourceId = `circle-source-${index}`;
          const layerId = `circle-layer-${index}`;
          const gridSourceId = `${sourceId}-grid`;
          const gridLayerId = `${layerId}-grid`;

          // Store IDs
          layerStateRef.current = {
            sourceId,
            layerId,
            gridSourceId,
            gridLayerId,
          };

          try {
            // Add source
            map.addSource(sourceId, {
              type: 'geojson',
              data: featureCollection,
              generateId: true,
            });

            if (featureCollection.is_grid) {
              let bounds;
              if (
                featureCollection.city_name &&
                cityBounds[featureCollection.city_name.toLowerCase()]
              ) {
                const cityBound = cityBounds[featureCollection.city_name.toLowerCase()].bounds;
                bounds = [
                  cityBound[0] - 0.1,
                  cityBound[1] - 0.1,
                  cityBound[2] + 0.1,
                  cityBound[3] + 0.1,
                ];
              } else {
                // Fallback to calculating bounds from features
                const bbox = turf.bbox(featureCollection);
                const bboxPolygon = turf.bboxPolygon(bbox);
                // Increase buffer for fallback bounds
                const bufferedBbox = turf.buffer(bboxPolygon, 1, { units: 'kilometers' });
                bounds = turf.bbox(bufferedBbox);
              }

              // Create grid
              const cellSide = gridSize / 1000;
              const options = { units: 'kilometers' as const };
              const grid = turf.squareGrid(bounds, cellSide, options);
              const emptyProperties: Record<string, null> = Object.keys(
                featureCollection.features[0].properties
              ).reduce(
                (acc, key) => {
                  acc[key] = null;
                  return acc;
                },
                {} as Record<string, null>
              );

              // Calculate density for each cell
              grid.features = grid.features.map((cell, index) => {
                const pointsWithin = turf.pointsWithinPolygon(featureCollection, cell);

                // Update density calculation to use basedon field if available
                const density =
                  featureCollection.basedon?.length > 0
                    ? pointsWithin.features.reduce((sum, point) => {
                        const value = point.properties[featureCollection.basedon];
                        return sum + (typeof value === 'number' ? value : 0);
                      }, 0)
                    : pointsWithin.features.length;

                // Calculate cell center for button placement
                const center = turf.center(cell);
                const centerCoords = center.geometry.coordinates;

                // Ensure coordinates are valid numbers
                if (
                  !Array.isArray(centerCoords) ||
                  centerCoords.length !== 2 ||
                  typeof centerCoords[0] !== 'number' ||
                  typeof centerCoords[1] !== 'number'
                ) {
                  console.error('Invalid center coordinates for cell:', index);
                  return cell;
                }

                // Store coordinates in LngLat format
                const center_obj = {
                  lng: Number(centerCoords[0]),
                  lat: Number(centerCoords[1]),
                };

                // Generate cell properties object with detailed statistics
                const cellProperties = pointsWithin.features.reduce(
                  (acc, point) => {
                    Object.entries(point.properties).forEach(([key, value]) => {
                      // Skip if the value is null/undefined
                      if (value == null) return;

                      // Convert value to number if possible
                      const numValue = Number(value);
                      if (isNaN(numValue)) return;

                      // Initialize property stats if not exists
                      if (!acc[key]) {
                        acc[key] = {
                          sum: 0,
                          values: [],
                          count: 0,
                        };
                      }

                      // Update aggregates
                      acc[key].sum += numValue;
                      acc[key].values.push(numValue);
                      acc[key].count++;
                    });
                    return acc;
                  },
                  {} as Record<string, PropertyStats>
                );

                // Calculate statistics for each property
                Object.entries(cellProperties).forEach(([key, stats]) => {
                  // Calculate average
                  stats.average = stats.sum / stats.count;

                  // Calculate median
                  if (stats.values.length > 0) {
                    const sorted = [...stats.values].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    stats.median =
                      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                  }
                });

                const cellStats = {
                  ...Object.entries(cellProperties).reduce(
                    (acc, [key, stats]) => {
                      acc[`${key}`] = _.round(stats.sum || 0, 2);
                      //acc[`${key}_sum`] = _.round(stats.sum || 0, 2);
                      //acc[`${key}_avg`] = _.round(stats.average || 0, 2);
                      //acc[`${key}_median`] = _.round(stats.median || 0, 2);
                      //acc[`${key}_count`] = _.round(stats.count || 0, 2);
                      return acc;
                    },
                    {} as Record<string, number>
                  ),
                };

                // Update cell properties with calculated statistics
                return {
                  ...cell,
                  id: index,
                  properties: {
                    ...cell.properties,
                    ...cellStats,
                    density,
                    center: center_obj,
                    pointCount: pointsWithin.features.length,
                  },
                };
              });

              // Add grid source
              map.addSource(gridSourceId, {
                type: 'geojson',
                data: grid,
                generateId: true,
              });

              // Calculate density values for styling
              const allDensityValues = grid.features.map(f => f.properties?.density || 0);
              const maxDensity = Math.max(...allDensityValues, 1);

              const p25 = maxDensity * 0.25;
              const p50 = maxDensity * 0.5;
              const p75 = maxDensity * 0.75;

              // Add grid layer with interactive settings
              map.addLayer({
                id: gridLayerId,
                type: 'fill',
                source: gridSourceId,
                layout: {
                  visibility: featureCollection.display ? 'visible' : 'none',
                },
                paint: getGridPaint(
                  USE_BASEDON && featureCollection.basedon?.length > 0,
                  featureCollection.points_color || defaultMapConfig.defaultColor,
                  p25,
                  p50,
                  p75
                ),
              });

              // Store IDs
              gridLayerIdRef.current = gridLayerId;
              layerStateRef.current.gridSourceId = gridSourceId;

              // Add click handler directly to grid cells
              map.on('click', gridLayerId, e => {
                e.preventDefault();
                handleGridCellClick(e, featureCollection, gridSourceId, featureCollection.basedon);
              });

              // Add hover effects for the grid cells
              map.on('mouseenter', gridLayerId, () => {
                map.getCanvas().style.cursor = 'pointer';
              });

              map.on('mouseleave', gridLayerId, () => {
                map.getCanvas().style.cursor = '';
              });
            } else if (featureCollection.is_heatmap) {
              map.addLayer({
                id: layerId,
                type: 'heatmap',
                source: sourceId,
                layout: {
                  visibility: featureCollection.display ? 'visible' : 'none',
                },
                paint: getHeatmapPaint(featureCollection.basedon, featureCollection.points_color),
              });
            } else {
              // Circle layer / points (default)
              map.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                layout: {
                  visibility: featureCollection.display ? 'visible' : 'none',
                },
                paint: featureCollection.is_gradient
                  ? getGradientCirclePaint(featureCollection.points_color)
                  : getCirclePaint(featureCollection.points_color, index),
              });
            }

            // Add hover interaction variables
            let hoveredStateId: number | null = null;
            let popup: mapboxgl.Popup | null = null;
            let isOverPopup = false;
            let isOverPoint = false;

            const handleMouseOverOrTouchStart = async (
              e:
                | (mapboxgl.MapMouseEvent & mapboxgl.EventData)
                | (mapboxgl.MapTouchEvent & mapboxgl.EventData)
            ) => {
              if (!map) return;
              isOverPoint = true;
              map.getCanvas().style.cursor = '';

              if (e.features && e.features.length > 0) {
                if (hoveredStateId !== null) {
                  map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: false });
                }

                hoveredStateId = e.features[0].id as number;
                map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: true });

                const coordinates = (e.features[0].geometry as any).coordinates.slice();
                const properties = e.features[0].properties as CustomProperties;

                // Show loading spinner in the popup
                const loadingContent = generatePopupContent(properties, coordinates, true, false);

                if (popup) {
                  popup.remove();
                }

                popup = new mapboxgl.Popup({
                  closeButton: isMobile,
                })
                  .setLngLat(coordinates)
                  .setHTML(loadingContent)
                  .addTo(map);

                const [lng, lat] = coordinates;

                try {
                  await apiRequest({
                    url: urls.check_street_view,
                    method: 'POST',
                    body: { lat, lng },
                  });

                  const updatedContent = generatePopupContent(
                    properties,
                    coordinates,
                    false,
                    false
                  );
                  popup?.setHTML(updatedContent);
                } catch (error) {
                  console.error('Error fetching street view:', error);
                  popup?.setHTML(generatePopupContent(properties, coordinates, false, false));
                }

                // Add popup element events
                if (popup) {
                  const popupElement = popup.getElement();
                  popupElement.addEventListener('mouseenter', () => {
                    isOverPopup = true;
                  });
                  popupElement.addEventListener('mouseleave', () => {
                    isOverPopup = false;
                    if (!isOverPoint && popup) {
                      popup.remove();
                      popup = null;
                    }
                  });
                }
              }
            };

            const handleMouseLeave = () => {
              if (!map) return;
              isOverPoint = false;
              map.getCanvas().style.cursor = '';

              setTimeout(() => {
                if (!isOverPopup && !isOverPoint && popup) {
                  popup.remove();
                  popup = null;
                }
              }, 500);

              if (hoveredStateId !== null) {
                map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: false });
              }
              hoveredStateId = null;
            };

            if (isMobile) {
              map.on('touchstart', layerId, handleMouseOverOrTouchStart);
            } else {
              map.on('mouseenter', layerId, handleMouseOverOrTouchStart);
              map.on('mouseleave', layerId, handleMouseLeave);
            }
          } catch (error) {
            console.error('Error adding layer:', error);
          }
        });
      } catch (error) {
        console.error('Error managing layers:', error);
      }
    };

    // Initial load
    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      const styleLoadHandler = () => {
        addLayers();
        map.off('style.load', styleLoadHandler);
      };
      map.on('style.load', styleLoadHandler);
    }

    return () => {
      cleanupLayers();
    };
  }, [mapRef, geoPoints, shouldInitializeFeatures, cityBounds]);
}
