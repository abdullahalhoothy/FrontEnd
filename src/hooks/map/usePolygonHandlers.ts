import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { usePolygonsContext } from '../../context/PolygonsContext';
import { useMapContext } from '../../context/MapContext';

export function usePolygonHandlers() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const map = mapRef.current;
  const { setPolygons } = usePolygonsContext();

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

    const handleDrawCreate = (e: any) => {
      const geojson = e.features[0];
      // Get center point of polygon
      let center;
      if (geojson.geometry.type === 'Polygon') {
        center = turf.centerOfMass(geojson).geometry.coordinates;
      } else if (geojson.geometry.type === 'MultiPolygon') {
        center = turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry.coordinates;
      }

      // Convert center to pixel coordinates
      const pixelPosition = center ? map.project(center as [number, number]) : null;

      // Set the shape property for regular polygons
      if (!geojson.properties) geojson.properties = {};
      geojson.properties.shape = 'polygon';
      geojson.isStatisticsPopupOpen = true;
      geojson.pixelPosition = pixelPosition;
      setPolygons(prev => [...prev, geojson]);
    };

    const handleDrawUpdate = (e: any) => {
      const geojson = e.features[0];
      const updatedPolygonsId = e.features[0].id;

      // Get center point of updated polygon
      let center;
      if (geojson.geometry.type === 'Polygon') {
        center = turf.centerOfMass(geojson).geometry.coordinates;
      } else if (geojson.geometry.type === 'MultiPolygon') {
        center = turf.centerOfMass(turf.multiPolygon(geojson.geometry.coordinates)).geometry.coordinates;
      }

      // Convert center to pixel coordinates
      const pixelPosition = center ? map.project(center as [number, number]) : null;

      geojson.isStatisticsPopupOpen = true;
      geojson.pixelPosition = pixelPosition;
      
      setPolygons(prev => 
        prev.map(polygon => 
          polygon.id === updatedPolygonsId ? geojson : polygon
        )
      );
    };

    const handleDrawDelete = (e: any) => {
      const deletedPolygonsId = e.features[0].id;
      setPolygons(prev => 
        prev.filter(polygon => polygon.id !== deletedPolygonsId)
      );
    };

    // Add event listeners
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);

    return () => {
      map.off('draw.create', handleDrawCreate);
      map.off('draw.update', handleDrawUpdate);
      map.off('draw.delete', handleDrawDelete);
    };
  }, [mapRef, setPolygons, shouldInitializeFeatures]);
} 