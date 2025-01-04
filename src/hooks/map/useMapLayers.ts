import { useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import { useCatalogContext } from '../../context/CatalogContext'
import { defaultMapConfig } from './useMapInitialization'
import {  colorOptions } from '../../utils/helperFunctions'
import { useMapContext } from '../../context/MapContext'

 const defaultCircleStrokeWidth = 1
 const defaultCircleStrokeColor = '#fff'

export function useMapLayers () {
  const { mapRef, shouldInitializeFeatures } = useMapContext()
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

            // Add hover effects
            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer'
            })

            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = ''
            })

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

    return () => {
      if (map) {
        map.off('style.load', styleChangeHandler)
      }
    }
  }, [mapRef, geoPoints, shouldInitializeFeatures])
}
