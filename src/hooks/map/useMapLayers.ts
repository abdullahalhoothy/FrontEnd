import { useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import { useCatalogContext } from '../../context/CatalogContext'
import { defaultMapConfig } from './useMapInitialization'
import { colorOptions } from '../../utils/helperFunctions'
import { useMapContext } from '../../context/MapContext'
import { generatePopupContent } from '../../pages/MapContainer/generatePopupContent'
import { CustomProperties }  from '../../types/allTypesAndInterfaces'
import { useUIContext } from '../../context/UIContext'
const defaultCircleStrokeWidth = 1
const defaultCircleStrokeColor = '#fff'

export function useMapLayers () {
  const { mapRef, shouldInitializeFeatures } = useMapContext()
  const { isMobile } = useUIContext()
  const map = mapRef.current
  const { geoPoints } = useCatalogContext()

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return

    const addLayers = () => {
      // Only proceed if style is fully loaded
      if (!map.isStyleLoaded()) {
        console.warn('Style not loaded, waiting...')
        return
      }

      try {
        // Clean up existing layers first
        geoPoints.forEach((_, index) => {
          const layerId = `circle-layer-${index}`
          const sourceId = `circle-source-${index}`

          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId)
            }
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId)
            }
          } catch (err) {
            console.warn(
              'Non-fatal layer cleanup error:',
              err
            )
          }
        })

        // Add new layers
        geoPoints.forEach((featureCollection, index) => {
          if (
            !featureCollection.type ||
            !Array.isArray(featureCollection.features)
          ) {
            console.error(
              '🗺️ [Map] Invalid GeoJSON structure:',
              featureCollection
            )
            return
          }

          const sourceId = `circle-source-${index}`
          const layerId = `circle-layer-${index}`

          try {
            // Add source
            map.addSource(sourceId, {
              type: 'geojson',
              data: featureCollection
            })

            // Add layer
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': defaultMapConfig.circleRadius,
                'circle-color': featureCollection.points_color || colorOptions[1].hex,
                'circle-opacity': defaultMapConfig.circleOpacity,
                'circle-stroke-width': defaultCircleStrokeWidth,
                'circle-stroke-color': defaultCircleStrokeColor
              }
            })

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
                  closeButton: window.innerWidth <= 768 // Mobile check
                })
                  .setLngLat(coordinates)
                  .setHTML(loadingContent)
                  .addTo(map)

                const [lng, lat] = coordinates

                try {
                  //TODO: Restore StreetView once 403 error is fixed in the backend

                  /*const response = await apiRequest({
                    url: urls.check_street_view,
                    method: 'POST',
                    body: { lat, lng }
                  })*/
                  
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
