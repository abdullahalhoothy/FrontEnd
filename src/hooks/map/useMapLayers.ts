import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useCatalogContext } from '../../context/CatalogContext';
import mapConfig from '../../mapConfig.json';

export function useMapLayers(map: mapboxgl.Map | null) {
  const { geoPoints } = useCatalogContext();

  useEffect(() => {
    console.log('#fix: switch mode - useMapLayers effect', {
      mapExists: !!map,
      styleLoaded: map?.isStyleLoaded(),
      geoPointsCount: geoPoints?.length
    });

    if (!map) return;

    const addLayers = () => {
      // Only proceed if style is fully loaded
      if (!map.isStyleLoaded()) {
        console.log('#fix: switch mode - Style not loaded, waiting...');
        return;
      }

      try {
        console.debug("🗺️ [Map] Adding layers", {
          mapExists: !!map,
          styleLoaded: map.isStyleLoaded(),
          geoPointsCount: geoPoints.length,
          geoPointsStructure: geoPoints.map(point => ({
            hasType: !!point.type,
            featureCount: point.features?.length,
            hasDisplay: 'display' in point,
            layerId: point.layerId
          }))
        });

        // Clean up existing layers first
        geoPoints.forEach((_, index) => {
          const layerId = `circle-layer-${index}`;
          const sourceId = `circle-source-${index}`;
          
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          } catch (err) {
            console.warn('#fix: switch mode - Non-fatal layer cleanup error:', err);
          }
        });

        // Add new layers
        geoPoints.forEach((featureCollection, index) => {
          if (!featureCollection.type || !Array.isArray(featureCollection.features)) {
            console.error("🗺️ [Map] Invalid GeoJSON structure:", featureCollection);
            return;
          }

          const sourceId = `circle-source-${index}`;
          const layerId = `circle-layer-${index}`;

          try {
            // Add source
            map.addSource(sourceId, {
              type: 'geojson',
              data: featureCollection
            });

            // Add layer
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': mapConfig.circleRadius,
                'circle-color': featureCollection.points_color || '#28A745',
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
              }
            });

            // Add hover effects
            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = '';
            });

            console.debug("🗺️ [Map] Successfully added layer:", {
              layerId,
              sourceId,
              featureCount: featureCollection.features.length
            });
          } catch (error) {
            console.error("🗺️ [Map] Error adding layer:", error);
          }
        });

        // Fit bounds to show all features
        if (geoPoints.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          
          geoPoints.forEach(layer => {
            layer.features?.forEach(feature => {
              if (feature.geometry?.coordinates) {
                bounds.extend(feature.geometry.coordinates as [number, number]);
              }
            });
          });

          if (!bounds.isEmpty()) {
            console.debug("🗺️ [Map] Fitting bounds:", bounds.toArray());
            
            map.fitBounds(bounds, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 15,
              duration: 1000
            });
          }
        }
      } catch (error) {
        console.error('#fix: switch mode - Error managing layers:', error);
      }
    };

    // Handle style changes
    const styleChangeHandler = () => {
      console.log('#fix: switch mode - Style changed, waiting for load');
      // Wait for next tick to ensure style is loaded
      setTimeout(addLayers, 0);
    };

    map.on('style.load', styleChangeHandler);

    // Initial load - also wait for style
    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      console.log('#fix: switch mode - Waiting for initial style load');
    }

    return () => {
      if (map) {
        map.off('style.load', styleChangeHandler);
      }
    };
  }, [map, geoPoints]);
} 