import { useState, useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export function useGridInteraction(
  map: mapboxgl.Map | null,
  createGridPopup: (coordinates: [number, number], properties: Record<string, number>) => void,
  cleanupGridPopup: () => void
) {
  const [selectedGridId, setSelectedGridId] = useState<number | null>(null);
  const [isGridSelected, setIsGridSelected] = useState(false);
  const clickDebounceRef = useRef<NodeJS.Timeout>();
  const gridSourceIdRef = useRef<string | null>(null);
  const lastSelectedGridRef = useRef<number | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const cellTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});
  const gridLayerIdRef = useRef<string | null>(null);

  const handleGridCellClick = useCallback(
    (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
      featureCollection: any,
      gridSourceId: string,
      basedonField: string
    ) => {
      if (!map || !e.features?.length) {
        console.log('No features found in click event');
        return;
      }

      const feature = e.features[0];
      if (!feature?.properties) {
        console.log('No properties in clicked feature');
        return;
      }

      // Clean up any existing popup
      cleanupGridPopup();

      // Get center coordinates from properties
      const center = feature.properties?.center;

      // Check if center is a string (might be serialized JSON)
      let centerObj;
      if (typeof center === 'string') {
        try {
          centerObj = JSON.parse(center);
        } catch (e) {
          console.error('Failed to parse center coordinates:', e);
          return;
        }
      } else {
        centerObj = center;
      }

      // Validate coordinates
      if (
        !centerObj ||
        typeof centerObj !== 'object' ||
        typeof centerObj.lng !== 'number' ||
        typeof centerObj.lat !== 'number'
      ) {
        console.error('Invalid center coordinates:', centerObj);
        return;
      }

      // Convert to array format for Mapbox
      const coordinates: [number, number] = [centerObj.lng, centerObj.lat];

      // Create popup with all properties
      createGridPopup(coordinates, feature.properties);
    },
    [map, createGridPopup, cleanupGridPopup]
  );

  const handleCellDeselect = useCallback(
    (cellId: number) => {
      // Set a timeout to handle the cell leave
      cellTimeoutRef.current[cellId] = setTimeout(() => {
        setSelectedCells(prev => {
          const next = new Set(prev);
          next.delete(cellId);
          return next;
        });

        // Only cleanup if no cells are selected
        if (selectedCells.size === 0) {
          cleanupGridPopup();
          setIsGridSelected(false);
          lastSelectedGridRef.current = null;
          if (map) {
            map.getCanvas().style.cursor = '';
          }
        }
      }, 50); // Small delay to handle cell transitions
    },
    [map, cleanupGridPopup, selectedCells]
  );

  // Add effect to update grid layer ID
  useEffect(() => {
    if (!map) return;

    const updateGridLayerId = () => {
      try {
        if (!map.isStyleLoaded()) {
          return;
        }

        const style = map.getStyle();
        const gridLayer = style.layers?.find(layer => layer.id.endsWith('-grid'));

        if (gridLayer) {
          gridLayerIdRef.current = gridLayer.id;
        }
      } catch (error) {
        console.debug('Style not ready:', error);
      }
    };

    // Initial check
    updateGridLayerId();

    // Listen for style load
    map.on('style.load', updateGridLayerId);

    return () => {
      map.off('style.load', updateGridLayerId);
    };
  }, [map]);

  // Update mousemove to click handler
  useEffect(() => {
    if (!map) return;

    const handleGridCellSelect = (e: mapboxgl.MapMouseEvent) => {
      // Skip if style or layer ID not ready
      if (!map.isStyleLoaded() || !gridLayerIdRef.current) return;

      try {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [gridLayerIdRef.current],
        });

        const feature = features[0];

        if (feature?.properties?.id) {
          const cellId = feature.properties.id;
          if (!selectedCells.has(cellId)) {
            handleGridCellClick(e as any, null, '', '');
          }
        } else {
          // Mouse is not over any cell
          Array.from(selectedCells).forEach(cellId => {
            handleCellDeselect(cellId);
          });
        }
      } catch (error) {
        console.debug('Query error:', error);
      }
    };

    map.on('click', handleGridCellSelect);

    return () => {
      map.off('click', handleGridCellSelect);
      Object.values(cellTimeoutRef.current).forEach(clearTimeout);
    };
  }, [map, selectedCells, handleGridCellClick, handleCellDeselect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      lastSelectedGridRef.current = null;
      if (selectedGridId !== null && map && gridSourceIdRef.current) {
        try {
          map.removeFeatureState({
            source: gridSourceIdRef.current,
            id: selectedGridId,
          });
        } catch (error) {
          console.debug('Cleanup error:', error);
        }
      }
    };
  }, [map, selectedGridId]);

  // Add cleanupHoverState function before return
  const cleanupGridSelection = useCallback(
    (gridSourceId: string) => {
      if (selectedGridId !== null && map) {
        try {
          map.removeFeatureState({
            source: gridSourceId,
            id: selectedGridId,
          });
        } catch (error) {
          console.debug('Non-fatal cleanup error:', error);
        }
      }
      setSelectedGridId(null);
      setIsGridSelected(false);
    },
    [map, selectedGridId]
  );

  return {
    selectedGridId,
    isGridSelected,
    handleGridCellClick,
    handleCellDeselect,
    clickDebounceRef,
    cleanupGridSelection,
  };
}
