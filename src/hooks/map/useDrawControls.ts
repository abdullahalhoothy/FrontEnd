import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { usePolygonsContext } from '../../context/PolygonsContext';

export function useDrawControls(map: mapboxgl.Map | null) {
  const { setPolygons } = usePolygonsContext();

  useEffect(() => {
    if (!map) return;

    // Initialize Draw
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      }
    });

    // Add the draw control
    map.addControl(draw, 'top-right');

    // Event handlers
    map.on('draw.create', e => {
      const center = map.getCenter();
      const radius = 750; // meters
      const circle = turf.circle([center.lng, center.lat], radius, { steps: 64, units: 'meters' });
      
      draw.add({
        type: 'Feature',
        properties: { shape: 'circle', radius },
        geometry: circle.geometry
      });
    });

    map.on('draw.update', e => {
      const geojson = e.features[0];
      setPolygons(prev => 
        prev.map(polygon => 
          polygon.id === geojson.id ? geojson : polygon
        )
      );
    });

    map.on('draw.delete', e => {
      const deletedId = e.features[0].id;
      setPolygons(prev => prev.filter(polygon => polygon.id !== deletedId));
    });

    return () => {
      if (map.hasControl(draw)) {
        map.removeControl(draw);
      }
    };
  }, [map, setPolygons]);
} 