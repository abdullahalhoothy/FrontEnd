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

    let controls: {
      styles?: StylesControl,
      navigation?: mapboxgl.NavigationControl,
      circle?: CircleControl,
      draw?: MapboxDraw
    } = {};

    const addControls = () => {
      if (controlsAdded.current) {
        return;
      }

      try {
        // Add styles control first
        controls.styles = new StylesControl(currentStyle, setCurrentStyle);
        map.addControl(controls.styles, 'top-right');

        // Add navigation control second
        controls.navigation = new mapboxgl.NavigationControl();
        map.addControl(controls.navigation, 'top-right');


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
              ...MapboxDraw.modes.simple_select as any,
              onDragMove: () => {}
            },
            direct_select: {
              ...MapboxDraw.modes.direct_select as any,
              onDragVertex: (state: any, e: any, delta: any) => {
                const feature = state.feature;
                if (feature.properties?.shape !== 'circle') {
                  (MapboxDraw.modes.direct_select as any).onDragVertex.call(
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
        console.error('Error adding controls:', error);
      }
    };

    // Try to add controls immediately if map is ready
    const attemptToAddControls = () => {
      if (map.loaded() && map.isStyleLoaded()) {
        addControls();
      } else {
        map.once('load', () => {
          if (map.isStyleLoaded()) {
            addControls();
          } else {
            map.once('style.load', () => {
              addControls();
            });
          }
        });
      }
    };

    attemptToAddControls();

    return () => {
      if (controlsAdded.current && map) {
        try {
          // Remove draw control first
          if (draw.current) {
            try {
              // Force cleanup of draw control
              if (map.hasControl(draw.current)) {
                map.removeControl(draw.current);
              }
            } catch (err) {
              console.warn('Non-fatal draw cleanup error:', err);
            } finally {
              // Always null the reference
              draw.current = null;
            }
          }

          // Remove other controls
          ['circle', 'navigation', 'styles'].forEach(key => {
            if (controls[key] && map.hasControl(controls[key])) {
              try {
                map.removeControl(controls[key]);
              } catch (err) {
                console.warn(`Non-fatal ${key} control cleanup error:`, err);
              }
            }
          });

        } catch (error) {
          console.warn('Control cleanup error:', error);
        } finally {
          controls = {};
          controlsAdded.current = false;
        }
      }
    };
  }, [map, currentStyle, setCurrentStyle, isMobile]);
} 