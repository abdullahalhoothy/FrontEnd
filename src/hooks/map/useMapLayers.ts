import { useEffect } from 'react'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import { useCatalogContext } from '../../context/CatalogContext'
import { defaultMapConfig } from './useMapInitialization'
import { colorOptions } from '../../utils/helperFunctions'
import * as turf from '@turf/turf'
import { useMapContext } from '../../context/MapContext'
import { generatePopupContent } from '../../pages/MapContainer/generatePopupContent'
import { CustomProperties } from '../../types/allTypesAndInterfaces'
import { useUIContext } from '../../context/UIContext'
import apiRequest from '../../services/apiRequest'
import urls from '../../urls.json'

const USE_BASEDON = false 

const getGridPaint = (basedonLength: boolean, pointsColor: string, p25: number, p50: number, p75: number) => ({
  'fill-color': pointsColor || defaultMapConfig.defaultColor,
  'fill-opacity': [
    'case',
    ['==', ['get', 'density'], 0],
    0,
    ['step', 
      ['get', 'density'], 
      0.2,
      p25, 0.4, 
      p50, 0.6, 
      p75, 0.8
    ]
  ],
  'fill-outline-color': [
    'case',
    ['==', ['get', 'density'], 0],
    'rgba(0,0,0,0)',
    '#000'
  ]
})

const getHeatmapPaint = (basedon: string, pointsColor?: string) => ({
  'heatmap-weight': [
    'interpolate',
    ['linear'],
    ['get', basedon || 'heatmap_weight'],
    0, 0,
    5, 1
  ],
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0, 'rgba(33,102,172,0)',
    0.2, pointsColor || defaultMapConfig.defaultColor,
    0.4, 'rgb(209,229,240)',
    0.6, 'rgb(253,219,199)',
    0.8, 'rgb(239,138,98)',
    1, 'rgb(178,24,43)'
  ]
})

const getCirclePaint = (pointsColor: string) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': pointsColor || colorOptions[1].hex,
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor
})

const getGradientCirclePaint = (defaultColor: string) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': [
    'coalesce',
    ['get', 'gradient_color'],  // Use gradient color if available
    defaultColor || defaultMapConfig.defaultColor  // Fallback to default
  ],
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor
});

export function useMapLayers() {
  const { mapRef, shouldInitializeFeatures } = useMapContext()
  const { isMobile } = useUIContext()
  const map = mapRef.current
  const { geoPoints } = useCatalogContext()

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return

    const addLayers = () => {
      if (!map.isStyleLoaded()) {
        console.warn('Style not loaded, waiting...')
        return
      }

      try {
        // Clean up existing layers first
        geoPoints.forEach((_, index) => {
          const layerId = `circle-layer-${index}`
          const sourceId = `circle-source-${index}`
          const gridLayerId = `${layerId}-grid`
          const gridSourceId = `${sourceId}-grid`

          try {
            if (map.getLayer(gridLayerId)) {
              map.removeLayer(gridLayerId)
            }
            if (map.getSource(gridSourceId)) {
              map.removeSource(gridSourceId)
            }
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId)
            }
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId)
            }
          } catch (err) {
            console.warn('Non-fatal layer cleanup error:', err)
          }
        })

        // Add new layers
        geoPoints.forEach((featureCollection, index) => {

          if (!featureCollection.type || !Array.isArray(featureCollection.features)) {
            console.error('🗺️ [Map] Invalid GeoJSON structure:', featureCollection)
            return
          }

          const sourceId = `circle-source-${index}`
          const layerId = `circle-layer-${index}`

          try {
            // Add source
            map.addSource(sourceId, {
              type: 'geojson',
              data: featureCollection,
              generateId: true
            })

            if (featureCollection.is_grid) {
              // Calculate bounds from features
              const bounds = turf.bbox(featureCollection)
              
              // Create grid
              const cellSide = defaultMapConfig.radiusInMeters / 1000
              const options = { units: 'kilometers' as const }
              const grid = turf.squareGrid(bounds, cellSide, options)

              // Calculate density for each cell
              grid.features = grid.features.map(cell => {
                const pointsWithin = turf.pointsWithinPolygon(featureCollection, cell)
                const density = USE_BASEDON && featureCollection.basedon?.length > 0
                  ? pointsWithin.features.reduce((sum, point) => {
                      const value = point.properties[featureCollection.basedon]
                      return sum + (typeof value === 'number' ? value : 0)
                    }, 0)
                  : pointsWithin.features.length


                return {
                  ...cell,
                  properties: { ...cell.properties, density }
                }
              })

              // Add grid source
              const gridSourceId = `${sourceId}-grid`
              map.addSource(gridSourceId, {
                type: 'geojson',
                data: grid
              })

              // Calculate density values for styling
              const allDensityValues = grid.features.map(f => f.properties?.density || 0)
              const maxDensity = Math.max(...allDensityValues, 1)
              
              const p25 = maxDensity * 0.25
              const p50 = maxDensity * 0.5
              const p75 = maxDensity * 0.75


              // Add grid layer
              const gridLayerId = `${layerId}-grid`
              map.addLayer({
                id: gridLayerId,
                type: 'fill',
                source: gridSourceId,
                layout: {
                  'visibility': featureCollection.display ? 'visible' : 'none'
                },
                paint: getGridPaint(
                  USE_BASEDON && featureCollection.basedon?.length > 0,
                  featureCollection.points_color || defaultMapConfig.defaultColor,
                  p25,
                  p50,
                  p75
                )
              })
            } else if (featureCollection.is_heatmap) {
              map.addLayer({
                id: layerId,
                type: 'heatmap',
                source: sourceId,
                layout: {
                  'visibility': featureCollection.display ? 'visible' : 'none'
                },
                paint: getHeatmapPaint(featureCollection.basedon, featureCollection.points_color)
              })
            } else {
              map.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                layout: {
                  'visibility': featureCollection.display ? 'visible' : 'none'
                },
                paint: featureCollection.is_gradient 
                  ? getGradientCirclePaint(featureCollection.points_color)
                  : getCirclePaint(featureCollection.points_color)
              });              
            }

            // Add hover interaction variables
            let hoveredStateId: number | null = null
            let popup: mapboxgl.Popup | null = null
            let isOverPopup = false
            let isOverPoint = false

            const handleMouseOverOrTouchStart = async (
              e: mapboxgl.MapMouseEvent & mapboxgl.EventData | mapboxgl.MapTouchEvent & mapboxgl.EventData
            ) => {
              if (!map) return
              isOverPoint = true
              map.getCanvas().style.cursor = ''

              if (e.features && e.features.length > 0) {
                if (hoveredStateId !== null) {
                  map.setFeatureState(
                    { source: sourceId, id: hoveredStateId },
                    { hover: false }
                  )
                }

                hoveredStateId = e.features[0].id as number
                map.setFeatureState(
                  { source: sourceId, id: hoveredStateId },
                  { hover: true }
                )

                const coordinates = (
                  e.features[0].geometry as any
                ).coordinates.slice()
                const properties = e.features[0].properties as CustomProperties

                // Show loading spinner in the popup
                const loadingContent = generatePopupContent(
                  properties,
                  coordinates,
                  true,
                  false
                )

                if (popup) {
                  popup.remove()
                }

                popup = new mapboxgl.Popup({
                  closeButton: isMobile
                })
                  .setLngLat(coordinates)
                  .setHTML(loadingContent)
                  .addTo(map)

                const [lng, lat] = coordinates

                try {

                  await apiRequest({
                    url: urls.check_street_view,
                    method: 'POST',
                    body: { lat, lng }
                  })
                  
                  const updatedContent = generatePopupContent(
                    properties,
                    coordinates,
                    false,
                    false
                  )
                  popup?.setHTML(updatedContent)
                } catch (error) {
                  console.error('Error fetching street view:', error)
                  popup?.setHTML(
                    generatePopupContent(properties, coordinates, false, false)
                  )
                }

                // Add popup element events
                if (popup) {
                const popupElement = popup.getElement()
                popupElement.addEventListener('mouseenter', () => {
                  isOverPopup = true
                })
                popupElement.addEventListener('mouseleave', () => {
                  isOverPopup = false
                  if (!isOverPoint && popup) {
                    popup.remove()
                      popup = null
                    }
                  }
                )}
              }
            }

            const handleMouseLeave = () => {
              if (!map) return
              isOverPoint = false
              map.getCanvas().style.cursor = ''

              setTimeout(() => {
                if (!isOverPopup && !isOverPoint && popup) {
                  popup.remove()
                  popup = null
                }
              }, 500)

              if (hoveredStateId !== null) {
                map.setFeatureState(
                  { source: sourceId, id: hoveredStateId },
                  { hover: false }
                )
              }
              hoveredStateId = null
            }

            if (isMobile) {
              map.on('touchstart', layerId, handleMouseOverOrTouchStart)
            } else {
              map.on('mouseenter', layerId, handleMouseOverOrTouchStart)
              map.on('mouseleave', layerId, handleMouseLeave)
            }

          } catch (error) {
            console.error('Error adding layer:', error)
          }
        })

        // Fit bounds to show all features
        if (geoPoints.length > 0) {
          const bounds = new mapboxgl.LngLatBounds()

          geoPoints.forEach(layer => {
            layer.features?.forEach(feature => {
              if (feature.geometry?.coordinates) {
                bounds.extend(feature.geometry.coordinates as [number, number])
              }
            })
          })

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 15,
              duration: 1000
            })
          }
        }
      } catch (error) {
        console.error('Error managing layers:', error)
      }
    }

    // Handle style changes
    const styleChangeHandler = () => {
      setTimeout(addLayers, 0)
    }

    map.on('style.load', styleChangeHandler)

    // Initial load - also wait for style
    if (map.isStyleLoaded()) {
      addLayers()
    } else {
      console.warn('Waiting for initial style load')
    }

    // Clean up function to remove all layers and sources
    const cleanupLayers = () => {
      if (!map.isStyleLoaded()) return;

      try {
        const style = map.getStyle();
        if (!style || !style.layers) return;

        // Remove all circle layers and their sources
        style.layers.forEach((layer: any) => {
          if (layer.id.startsWith('circle-layer-')) {
            const sourceId = `circle-source-${layer.id.split('-')[2]}`;
            if (map.getLayer(layer.id)) {
              map.removeLayer(layer.id);
            }
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          }
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    // Cleanup on unmount or when geoPoints changes
    return () => {
      cleanupLayers();
    };
  }, [mapRef, geoPoints, shouldInitializeFeatures])
}
