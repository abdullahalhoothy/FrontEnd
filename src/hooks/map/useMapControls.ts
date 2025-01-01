import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { StylesControl } from '../../components/Map/StylesControl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { CircleControl } from '../../components/Map/CircleControl';
import { useUIContext } from '../../context/UIContext';

export function useMapControls(
  map: mapboxgl.Map | null, 
  currentStyle: string,
  setCurrentStyle: (style: string) => void
) {
  const controlsAdded = useRef(false);
  const draw = useRef<MapboxDraw | null>(null);
  const { isMobile } = useUIContext();

  useEffect(() => {
    if (!map) return;

    console.log('useMapControls: Starting to add controls');

    let controls: {
      styles?: typeof StylesControl,
      navigation?: mapboxgl.NavigationControl,
      circle?: CircleControl,
      draw?: MapboxDraw
    } = {};

    const addControls = () => {
      if (controlsAdded.current) {
        console.log('useMapControls: Controls already added');
        return;
      }

      console.log('useMapControls: Adding controls');

      try {
        // Add styles control first
        controls.styles = new StylesControl(currentStyle, setCurrentStyle);
        map.addControl(controls.styles, 'top-right');
        console.log('useMapControls: Added styles control');

        // Add navigation control second
        controls.navigation = new mapboxgl.NavigationControl();
        map.addControl(controls.navigation, 'top-right');
        console.log('useMapControls: Added navigation control');

        // Initialize and add draw control third
        draw.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            point: false,
            line_string: false,
            polygon: true,
            trash: true
          },
          defaultMode: 'simple_select',
          modes: {
            ...MapboxDraw.modes,
            simple_select: { 
              ...MapboxDraw.modes.simple_select, 
              dragMove() {} 
            },
            direct_select: {
              ...MapboxDraw.modes.direct_select,
              dragVertex(state, e, delta) {
                const feature = state.feature;
                if (feature.properties?.shape !== 'circle') {
                  MapboxDraw.modes.direct_select.dragVertex.call(
                    this,
                    state,
                    e,
                    delta
                  );
                }
              }
            }
          }
        });

        controls.circle = new CircleControl(map, draw.current, isMobile);
        map.addControl(controls.circle, 'top-right');
        
        
        map.addControl(draw.current);
        controlsAdded.current = true;
      } catch (error) {
        console.error('useMapControls: Error adding controls:', error);
      }
    };

    // Try to add controls immediately if map is ready
    const attemptToAddControls = () => {
      if (map.loaded() && map.isStyleLoaded()) {
        console.log('useMapControls: Map and style are loaded, adding controls');
        addControls();
      } else {
        console.log('useMapControls: Map or style not ready, waiting...');
        map.once('load', () => {
          console.log('useMapControls: Map load event fired');
          if (map.isStyleLoaded()) {
            addControls();
          } else {
            map.once('style.load', () => {
              console.log('useMapControls: Style load event fired');
              addControls();
            });
          }
        });
      }
    };

    attemptToAddControls();

    return () => {
      console.log('useMapControls: Cleaning up controls');
      if (controlsAdded.current) {
        Object.values(controls).forEach(control => {
          if (control) {
            try {
              map.removeControl(control);
            } catch (error) {
              console.error('Error removing control:', error);
            }
          }
        });
        if (draw.current) {
          try {
            map?.removeControl(draw.current);
          } catch (error) {
            console.error('Error removing draw control:', error);
          }
        }
        controlsAdded.current = false;
      }
    };
  }, [map, currentStyle, setCurrentStyle, isMobile]);
} 