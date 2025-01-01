import { useEffect } from 'react';
import { StylesControl } from './StylesControl';
import mapboxgl from 'mapbox-gl';

interface MapControlsProps {
  map: mapboxgl.Map;
  currentStyle: string;
  setCurrentStyle: (style: string) => void;
}

export default function MapControls({ map, currentStyle, setCurrentStyle }: MapControlsProps) {
  useEffect(() => {
    const stylesControl = new StylesControl(currentStyle, setCurrentStyle)
    map.addControl(stylesControl, 'top-right')
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Set navigation control ID
    const navControlContainer = map
      .getContainer()
      .querySelector('.mapboxgl-ctrl-top-right .mapboxgl-ctrl-group')
    if (navControlContainer) {
      navControlContainer.setAttribute('id', 'navigation-control')
    }

    return () => {
      map.removeControl(stylesControl);
      map.removeControl(map.getControl('navigation-control'));
    };
  }, [map, currentStyle]);

  return null;
} 