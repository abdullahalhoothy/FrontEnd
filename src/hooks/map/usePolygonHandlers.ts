import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { usePolygonsContext } from '../../context/PolygonsContext';
import { useMapContext } from '../../context/MapContext';
export function usePolygonHandlers() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const map = mapRef.current;
  const { polygons, setPolygons } = usePolygonsContext();

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

    /**
     * Click handler for polygons, opens and closes the statistics popup
     */
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const coordinates = e.lngLat;
      const point = [coordinates.lng, coordinates.lat];

      const clickedPolygon = polygons.find(polygon => {
        try {
          let turfPolygon;
          if (polygon.geometry.type === 'Polygon') {
            turfPolygon = turf.polygon(polygon.geometry.coordinates);
          } else if (polygon.geometry.type === 'MultiPolygon') {
            turfPolygon = turf.multiPolygon(polygon.geometry.coordinates);
          } else {
            console.error('Unsupported geometry type:', polygon.geometry.type);
            return false;
          }

          return turf.booleanPointInPolygon(point, turfPolygon);
        } catch (error) {
          console.error('Error processing polygon:', error);
          return false;
        }
      });

      if (clickedPolygon) {
        const pixelPosition = map.project(coordinates);
        setPolygons(prev =>
          prev.map(polygon => {
            if (polygon.id === clickedPolygon.id) {
              return {
                ...polygon,
                isStatisticsPopupOpen: !polygon.isStatisticsPopupOpen, // Toggle popup
                pixelPosition: pixelPosition,
              };
            }
            return polygon;
          })
        );
      }
    };

    /**
     * Draw handler for polygons, creates a new polygon
     */
    const handleDrawCreate = (e: any) => {
      const geojson = e.features[0];
      // Get center point of polygon
      let center;
      if (geojson.geometry.type === 'Polygon') {
        center = turf.centerOfMass(geojson).geometry.coordinates;
      } else if (geojson.geometry.type === 'MultiPolygon') {
        center = turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry
          .coordinates;
      }

      // Convert center to pixel coordinates
      const pixelPosition = center ? map.project(center as [number, number]) : null;

      // Set the shape property for regular polygons
      if (!geojson.properties) geojson.properties = {};
      geojson.properties.shape = geojson.properties.shape ? geojson.properties.shape : 'polygon';
      geojson.isStatisticsPopupOpen = true;
      geojson.pixelPosition = pixelPosition;
      setPolygons(prev => [...prev, geojson]);
    };

    /**
     * Update handler for polygons
     */
    const handleDrawUpdate = (e: mapboxgl.MapMouseEvent) => {
      const geojson = e.features[0];
      const updatedPolygonsId = e.features[0].id;

      // Get center point of updated polygon
      let center;
      if (geojson.geometry.type === 'Polygon') {
        center = turf.centerOfMass(geojson).geometry.coordinates;
      } else if (geojson.geometry.type === 'MultiPolygon') {
        center = turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry
          .coordinates;
      }

      // Convert center to pixel coordinates
      const pixelPosition = center ? map.project(center as [number, number]) : null;

      geojson.isStatisticsPopupOpen = true;
      geojson.pixelPosition = pixelPosition;

      setPolygons(prev =>
        prev.map(polygon => (polygon.id === updatedPolygonsId ? geojson : polygon))
      );
    };

    /**
     * Delete handler for polygons, deletes a polygon
     */
    const handleDrawDelete = (e: mapboxgl.MapMouseEvent) => {
      const deletedPolygonsId = e.features[0].id;
      setPolygons(prev => prev.filter(polygon => polygon.id !== deletedPolygonsId));
    };

    /**
     * Event listeners
     */
    map.on('click', handleMapClick);
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);

    /**
     * Cleanup function
     */
    return () => {
      if (map) {
        map.off('click', handleMapClick);
        map.off('draw.create', handleDrawCreate);
        map.off('draw.update', handleDrawUpdate);
        map.off('draw.delete', handleDrawDelete);
      }
    };
  }, [map, shouldInitializeFeatures, polygons, setPolygons]);
}
