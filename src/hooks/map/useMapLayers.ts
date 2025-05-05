import { useEffect, useState, useCallback, useRef } from 'react';
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
import { isIntelligentLayer } from '../../utils/layerUtils';
const USE_BASEDON = true;

import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100,
});

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
  'heatmap-weight': ['interpolate', ['linear'], ['get', 'density'], 0, 0, 5, 1],
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

const getCirclePaint = (pointsColor: string | undefined, layerId: number) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': pointsColor || getDefaultLayerColor(layerId),
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor,
});

const getGradientCirclePaint = (defaultColor: string | undefined) => ({
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

  // Replace the single layerStateRef with layerStatesRef
  const layerStatesRef = useRef<{
    [key: string]: {
      sourceId: string;
      layerId: string;
      gridSourceId: string | null;
      gridLayerId: string | null;
    };
  }>({});

  // Initialize popup handlers first
  const { createGridPopup, cleanupGridPopup } = useGridPopup(map);

  // Then initialize grid handlers with the popup functions
  const { handleGridCellClick, cleanupGridSelection } = useGridInteraction(
    map,
    createGridPopup,
    cleanupGridPopup
  );

  // Update cleanup function to handle multiple layers
  const cleanupLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      // Clean up popups first
      cleanupGridPopup();

      // Clean up each layer
      Object.values(layerStatesRef.current).forEach(layerState => {
        const { gridLayerId, gridSourceId, layerId, sourceId } = layerState;

        // Remove button layer first
        if (gridLayerId && map.getLayer(`${gridLayerId}-buttons`)) {
          map.removeLayer(`${gridLayerId}-buttons`);
        }

        // Remove outline layer for polygons first
        if (gridLayerId && map.getLayer(`${gridLayerId}-outline`)) {
          map.removeLayer(`${gridLayerId}-outline`);
        }

        // Then remove grid/polygon layer
        if (gridLayerId && map.getLayer(gridLayerId)) {
          map.removeLayer(gridLayerId);
        }

        // Remove regular layers
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

        // Clean up grid selection state
        cleanupGridSelection(gridSourceId || '');
      });

      // Remove image
      if (map.hasImage('info-button')) {
        map.removeImage('info-button');
      }

      // Clear refs
      layerStatesRef.current = {};
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
        console.warn('Style not loaded, deferring layer update...');
        const styleLoadHandler = () => {
          if (map.isStyleLoaded()) {
            addLayers();
          }
          map.off('style.load', styleLoadHandler);
        };
        map.on('style.load', styleLoadHandler);
        return;
      }

      try {
        // Always clean up existing layers first
        cleanupLayers();
        cleanupGridPopup();

        // Reset layer state
        layerStatesRef.current = {};

        if (geoPoints.length > 0) {
          [...geoPoints]
            .reverse()
            .sort((a, b) => {
              // Intelligent layers should be added first (bottom)
              if (isIntelligentLayer(a) && !isIntelligentLayer(b)) return -1;
              if (!isIntelligentLayer(a) && isIntelligentLayer(b)) return 1;

              // Then grid layers
              if (a.is_grid && !b.is_grid) return -1;
              if (!a.is_grid && b.is_grid) return 1;

              // Then heatmap layers
              if (a.is_heatmap && !b.is_heatmap) return -1;
              if (!a.is_heatmap && b.is_heatmap) return 1;

              // Regular point/circle layers last (top)
              return 0;
            })
            .forEach(async (featureCollection, index) => {
              if (!featureCollection.type || !Array.isArray(featureCollection.features)) {
                console.error('🗺️ [Map] Invalid GeoJSON structure:', featureCollection);
                return;
              }

              const sourceId = `circle-source-${index}`;
              const layerId = `circle-layer-${index}`;
              const gridSourceId = `${sourceId}-grid`;
              const gridLayerId = `${layerId}-grid`;

              // Store IDs for this specific layer
              layerStatesRef.current[index] = {
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

                if (featureCollection.is_fake) {
                  console.time('Polygon processing');

                  try {
                    const worker = new Worker(
                      new URL('../../workers/polygonGridGeneration.worker.ts', import.meta.url),
                      {
                        type: 'module',
                      }
                    );

                    worker.postMessage({ featureCollection });

                    const processedData = await new Promise<any>((resolve, reject) => {
                      worker.onmessage = event => {
                        if (event.data.error) {
                          reject(new Error(event.data.error));
                        } else {
                          resolve(event.data);
                        }
                      };
                      worker.onerror = err => reject(err);
                    });

                    worker.terminate();

                    // Add source with processed polygons
                    map.addSource(gridSourceId, {
                      type: 'geojson',
                      data: {
                        type: 'FeatureCollection',
                        features: processedData.features,
                      },
                      generateId: true,
                    });

                    // Calculate density values for styling
                    const allDensityValues = processedData.features.map(
                      f => f.properties?.density || 0
                    );
                    const maxDensity = Math.max(...allDensityValues, 1);

                    // Add fill layer for polygons
                    map.addLayer({
                      id: gridLayerId,
                      type: 'fill',
                      source: gridSourceId,
                      layout: {
                        visibility: featureCollection.display ? 'visible' : 'none',
                      },
                      paint: {
                        'fill-color':
                          featureCollection.points_color || defaultMapConfig.defaultColor,
                        'fill-opacity': [
                          'interpolate',
                          ['linear'],
                          ['get', 'density'],
                          0,
                          0.1,
                          maxDensity,
                          0.8,
                        ],
                        'fill-outline-color': '#000',
                      },
                    });

                    // Add outline layer for polygons
                    map.addLayer({
                      id: `${gridLayerId}-outline`,
                      type: 'line',
                      source: gridSourceId,
                      layout: {
                        visibility: featureCollection.display ? 'visible' : 'none',
                      },
                      paint: {
                        'line-color': '#000',
                        'line-width': 1,
                      },
                    });

                    console.timeEnd('Polygon processing');

                    // Store IDs
                    gridLayerIdRef.current = gridLayerId;
                    layerStatesRef.current[index].gridSourceId = gridSourceId;

                    // Add click handler directly to grid cells
                    map.on('click', gridLayerId, e => {
                      e.preventDefault();
                      handleGridCellClick(
                        e,
                        featureCollection,
                        gridSourceId,
                        featureCollection.basedon
                      );
                    });

                    // Add hover effects for the grid cells
                    map.on('mouseenter', gridLayerId, () => {
                      map.getCanvas().style.cursor = 'pointer';
                    });

                    map.on('mouseleave', gridLayerId, () => {
                      map.getCanvas().style.cursor = '';
                    });
                  } catch (error) {
                    console.error('Error processing polygons:', error);
                  }
                } else if (featureCollection.is_grid) {
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

                  // Calculate density for each cell
                  console.time('Grid generation');

                  const cacheKey = JSON.stringify([cellSide, bounds]);

                  if (cache.has(cacheKey)) {
                    grid.features = cache.get(cacheKey);
                  } else {
                    const worker = new Worker(
                      new URL('../../workers/gridGeneration.worker.ts', import.meta.url),
                      {
                        type: 'module',
                      }
                    );

                    worker.postMessage({ grid, featureCollection });

                    grid.features = await new Promise<any[]>((resolve, reject) => {
                      worker.onmessage = event => {
                        resolve(event.data.features);
                      };
                      worker.onerror = err => reject(err);
                    });

                    worker.terminate();

                    cache.set(cacheKey, grid.features);
                  }

                  console.timeEnd('Grid generation');

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
                  layerStatesRef.current[index].gridSourceId = gridSourceId;

                  // Add click handler directly to grid cells
                  map.on('click', gridLayerId, e => {
                    e.preventDefault();
                    handleGridCellClick(
                      e,
                      featureCollection,
                      gridSourceId,
                      featureCollection.basedon
                    );
                  });

                  // Add hover effects for the grid cells
                  map.on('mouseenter', gridLayerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                  });

                  map.on('mouseleave', gridLayerId, () => {
                    map.getCanvas().style.cursor = '';
                  });
                } else if (featureCollection.is_heatmap) {
                  const worker = new Worker(
                    new URL('../../workers/heatmapGeneration.worker.ts', import.meta.url),
                    {
                      type: 'module',
                    }
                  );

                  try {
                    worker.postMessage({
                      featureCollection,
                      basedon: featureCollection.basedon,
                    });

                    const processedData = await new Promise<any>((resolve, reject) => {
                      worker.onmessage = event => {
                        if (event.data.error) {
                          reject(new Error(event.data.error));
                        } else {
                          resolve(event.data);
                        }
                      };
                      worker.onerror = err => reject(err);
                    });

                    worker.terminate();

                    map.getSource(sourceId).setData({
                      type: 'FeatureCollection',
                      features: processedData.features,
                    });

                    map.addLayer({
                      id: layerId,
                      type: 'heatmap',
                      source: sourceId,
                      layout: {
                        visibility: featureCollection.display ? 'visible' : 'none',
                      },
                      paint: getHeatmapPaint(
                        featureCollection.basedon,
                        featureCollection.points_color
                      ),
                    });
                  } catch (error) {
                    console.error('Error processing heatmap:', error);
                  }
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
                      map.setFeatureState(
                        { source: sourceId, id: hoveredStateId },
                        { hover: false }
                      );
                    }

                    hoveredStateId = e.features[0].id as number;
                    map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: true });

                    const coordinates = (e.features[0].geometry as any).coordinates.slice();
                    const properties = e.features[0].properties as CustomProperties;

                    // Show loading spinner in the popup
                    const loadingContent = generatePopupContent(
                      properties,
                      coordinates,
                      true,
                      false
                    );

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

                    if (popup) {
                      const popupElement = popup.getElement();
                      popupElement.addEventListener('click', e => e.stopPropagation());
                    }
                  }
                };

                const handleMouseLeave = () => {
                  if (!map) return;
                  isOverPoint = false;
                  map.getCanvas().style.cursor = '';

                  if (hoveredStateId !== null) {
                    map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: false });
                  }
                  hoveredStateId = null;
                };

                if (isMobile) {
                  map.on('touchstart', layerId, handleMouseOverOrTouchStart);
                } else {
                  map.on('click', layerId, handleMouseOverOrTouchStart);
                  map.on('mouseleave', layerId, handleMouseLeave);
                }
              } catch (error) {
                console.error('Error adding layer:', error);
              }
            });
        }
      } catch (error) {
        console.error('Error managing layers:', error);
      }
    };

    // Attempt to add layers with retry
    const attemptToAddLayers = () => {
      if (map.isStyleLoaded()) {
        addLayers();
      } else {
        let retryCount = 0;
        const maxRetries = 50; // 5 seconds total

        const retryInterval = setInterval(() => {
          if (map.isStyleLoaded()) {
            clearInterval(retryInterval);
            addLayers();
          } else if (retryCount >= maxRetries) {
            clearInterval(retryInterval);
          }
          retryCount++;
        }, 100);
      }
    };

    attemptToAddLayers();
    return () => {
      cleanupLayers();
    };
  }, [mapRef, geoPoints, shouldInitializeFeatures, cityBounds]);
}
