import { useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { generateGridPopupContent } from '../../utils/gridUtils';

export function useGridPopup(map: mapboxgl.Map | null) {
  // Keep track of all active popups
  const activePopupsRef = useRef<Set<mapboxgl.Popup>>(new Set());
  const [gridPopup, setGridPopup] = useState<mapboxgl.Popup | null>(null);

  const createGridPopup = useCallback(
    (coordinates: [number, number], properties: Record<string, number>) => {
      if (!map) return;

      try {
        const popupContent = generateGridPopupContent(properties);
        if (!popupContent) return;

        const newPopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          className: 'grid-cell-popup',
          offset: [0, -10],
          maxWidth: '300px',
        })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);

        // Add to active popups collection
        activePopupsRef.current.add(newPopup);

        // Add removal listener
        newPopup.on('close', () => {
          activePopupsRef.current.delete(newPopup);
          if (gridPopup === newPopup) {
            setGridPopup(null);
          }
        });

        setGridPopup(newPopup);
      } catch (error) {
        console.error('Error creating popup:', error);
      }
    },
    [map, gridPopup]
  );

  const cleanupGridPopup = useCallback(() => {
    // Remove all active popups
    activePopupsRef.current.forEach(popup => {
      popup.remove();
    });

    // Clear the collection
    activePopupsRef.current.clear();
    setGridPopup(null);
  }, []);

  return {
    gridPopup,
    createGridPopup,
    cleanupGridPopup,
  };
}
