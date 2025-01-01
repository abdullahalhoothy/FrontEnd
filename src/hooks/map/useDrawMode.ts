import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { usePolygonsContext } from '../../context/PolygonsContext';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export function useDrawMode(
  map: mapboxgl.Map | null, 
  draw: React.MutableRefObject<MapboxDraw | null>
) {
  const { setPolygons } = usePolygonsContext();

  useEffect(() => {
    if (!map) return;

    // Initialize Draw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      styles: [
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon']],
          'paint': {
            'fill-color': '#115740',
            'fill-opacity': 0.1
          }
        },
        {
          'id': 'gl-draw-polygon-stroke',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon']],
          'paint': {
            'line-color': '#115740',
            'line-width': 2
          }
        }
      ]
    });

    // Add draw control to the top right
    map.addControl(draw.current, 'top-right');

    // Event handlers
    map.on('draw.create', e => {
      const geojson = e.features[0];
      setPolygons(prev => [...prev, geojson]);
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
      if (map.hasControl(draw.current)) {
        map.removeControl(draw.current);
      }
    };
  }, [map, setPolygons]);
} 