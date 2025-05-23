import React, { useEffect, useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from '../../context/MapContext';
import { useUIContext } from '../../context/UIContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { useLongPress } from 'use-long-press';
import MapMenu from './MapMenu';
import './mapbox-custom.css';
import { useMeasurement } from '../../hooks/useMeasurement';

const SavedLocations: React.FC = () => {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const { openModal, closeModal, isModalOpen } = useUIContext();
  const [tempMarker, setTempMarker] = useState<mapboxgl.Marker | null>(null);
  const { markers, addMarker, deleteMarker, setMarkers, isMarkersEnabled } = useCatalogContext();
  const [lastLngLat, setLastLngLat] = useState<mapboxgl.LngLat | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [menuLngLat, setMenuLngLat] = useState<mapboxgl.LngLat | null>(null);

  const { isMobile } = useUIContext();
  const { isMeasuring, initializeMeasureMode, exitMeasureMode, handleMapClickForMeasurement } =
    useMeasurement();

  const handleMapClickForMeasurementRef = useRef(handleMapClickForMeasurement);
  useEffect(() => {
    handleMapClickForMeasurementRef.current = handleMapClickForMeasurement;
  }, [handleMapClickForMeasurement]);

  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    console.log('markers', markers);
  }, [markers]);

  useEffect(() => {
    if (!isMarkersEnabled) {
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
      if (isMeasuring) {
        exitMeasureMode();
      }

      Object.values(markersRef.current).forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.error('Error removing marker:', error);
        }
      });

      markersRef.current = {};
    }
  }, [isMarkersEnabled, tempMarker, setMarkers, isMeasuring, exitMeasureMode]);

  const handleCloseModal = useCallback(() => {
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
    closeModal();
  }, [tempMarker, closeModal]);

  useEffect(() => {
    if (!isModalOpen && tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
  }, [isModalOpen, tempMarker]);

  const createMarkerModal = useCallback(
    (
      onSave: (name: string, description: string) => void,
      initialName?: string,
      initialDescription?: string
    ) => (
      <div className="p-0 w-44">
        <h2 className="text-xl font-bold mb-2">Marker</h2>

        <form
          onSubmit={event => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;

            if (name) {
              onSave(name, description);
              handleCloseModal();
            }
          }}
        >
          <div className="mb-2">
            <label htmlFor="name" className="block mb-2 font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-required="true"
              placeholder="Enter a name"
              defaultValue={initialName}
            />
          </div>

          <div className="mb-2">
            <label htmlFor="description" className="block mb-2 font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Enter a description"
              className="w-full p-2 border rounded-md resize-none"
              defaultValue={initialDescription}
            />
          </div>

          <div className="flex justify-between gap-2">
            <button
              type="submit"
              className="w-full px-4 py-2 shadow-sm bg-gem-gradient text-white rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    ),
    [handleCloseModal]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (!isMarkersEnabled) return;

    markers.forEach(markerData => {
      const marker = new mapboxgl.Marker().setLngLat(markerData.coordinates).addTo(map);

      const popup = new mapboxgl.Popup({
        offset: 0,
        className: 'marker-popup',
        closeButton: true,
        closeOnClick: false,
      }).setHTML(`
          <div class="marker-popup-content bg-white rounded-lg shadow-lg p-2 max-w-xs">
            <h3 class="font-bold text-lg text-gray-800 mb-2">${markerData.name}</h3>
            <p class="text-gray-600 mb-${markerData.description ? '3' : '0'}">${markerData.description}</p>
            <div class="mt-2 w-full flex justify-end gap-1">
              <button class="delete-location text-xs bg-red-500 hover:bg-red-600 transition-colors duration-200 text-white px-2 py-1.5 rounded-md shadow-sm flex items-center justify-center" data-id="${markerData.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button class="edit-location text-xs bg-blue-500 hover:bg-blue-600 transition-colors duration-200 text-white px-2 py-1 rounded-md shadow-sm flex items-center justify-center" data-id="${markerData.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        `);

      popup.on('open', () => {
        setTimeout(() => {
          const popupContent = document.querySelector('.marker-popup-content');
          if (popupContent) {
            popupContent.addEventListener('click', e => {
              e.stopPropagation();
            });
          }
        }, 100);
      });

      marker.setPopup(popup);

      markersRef.current[markerData.id] = marker;
    });

    const setupPopupListeners = () => {
      document.querySelectorAll('.delete-location').forEach(button => {
        if (button instanceof HTMLElement) {
          const id = button.getAttribute('data-id');
          if (id) {
            button.onclick = e => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(id);
            };
          }
        }
      });

      document.querySelectorAll('.edit-location').forEach(button => {
        if (button instanceof HTMLElement) {
          const id = button.getAttribute('data-id');
          if (id) {
            button.onclick = e => {
              e.preventDefault();
              e.stopPropagation();
              handleEdit(id);
            };
          }
        }
      });

      document.querySelectorAll('.marker-popup-content').forEach(content => {
        content.addEventListener('click', e => {
          e.stopPropagation();
        });
      });
    };

    map.on('click', () => {
      setTimeout(setupPopupListeners, 100);
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
    };
  }, [markers, shouldInitializeFeatures, mapRef, isMarkersEnabled]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!isMarkersEnabled) return;

      const currentMarkers = markersRef.current;
      if (currentMarkers[id]) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }

      deleteMarker(id);
    },
    [isMarkersEnabled, deleteMarker]
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (!isMarkersEnabled) return;

      const markerToEdit = markers.find(marker => marker.id === id);
      if (!markerToEdit) return;

      const onSave = (name: string, description: string) => {
        const updatedMarkers = markers.map(marker => {
          if (marker.id === id) {
            return { ...marker, name, description };
          }
          return marker;
        });
        setMarkers(updatedMarkers);
      };

      openModal(createMarkerModal(onSave, markerToEdit.name, markerToEdit.description), {
        isSmaller: true,
        hasAutoSize: true,
      });
    },
    [isMarkersEnabled, markers, openModal, createMarkerModal, setMarkers]
  );
  const formatCoordinates = useCallback((lngLat: mapboxgl.LngLat | null) => {
    if (!lngLat) return '';
    return `${lngLat.lng.toFixed(6)}, ${lngLat.lat.toFixed(6)}`;
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
    setMenuLngLat(null);
  }, []);

  const createNewMarker = useCallback(
    (lngLat: mapboxgl.LngLat) => {
      if (!isMarkersEnabled || !mapRef.current) return;

      if (tempMarker) {
        tempMarker.remove();
      }

      const newTempMarker = new mapboxgl.Marker({ scale: 0.9, color: '#7D00B8' })
        .setLngLat(lngLat)
        .addTo(mapRef.current);

      setTempMarker(newTempMarker);

      const onSave = (name: string, description: string) => {
        addMarker(name, description, [lngLat.lng, lngLat.lat]);
        if (newTempMarker) {
          newTempMarker.remove();
          setTempMarker(null);
        }
      };

      openModal(createMarkerModal(onSave), { isSmaller: true, hasAutoSize: true });
    },
    [isMarkersEnabled, mapRef, tempMarker, addMarker, openModal, createMarkerModal]
  );

  const startMeasureDistance = useCallback(() => {
    closeMenu();
    initializeMeasureMode();
  }, [closeMenu, initializeMeasureMode]);

  const longPressHandler = useLongPress(
    event => {
      if (!isMarkersEnabled || !lastLngLat) return;

      if (isMeasuring) {
        exitMeasureMode();
      }

      if (event.target) {
        const touch = (event as unknown as TouchEvent).touches[0];
        setMenuPosition({ x: touch.clientX, y: touch.clientY });
        setMenuLngLat(lastLngLat);
      }
    },
    {
      threshold: 500,
      captureEvent: true,
      cancelOnMovement: true,
    }
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    if (!isMarkersEnabled) {
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
      closeMenu();
      return;
    }

    // Handle right click for desktop
    const handleRightClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isMarkersEnabled) return;
      e.preventDefault();

      if (isMeasuring) {
        exitMeasureMode();
      }

      // Show the context menu at the clicked position
      setMenuPosition({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
      setMenuLngLat(e.lngLat);
    };

    // Handle touch for mobile (to capture coordinates)
    const handleTouchStart = (e: mapboxgl.MapTouchEvent) => {
      if (!isMarkersEnabled) return;
      setLastLngLat(e.lngLat);
    };

    // Apply longPress to the map container for mobile
    if (isMobile() && map.getContainer()) {
      const container = map.getContainer();
      container.setAttribute('role', 'application');
      Object.entries(longPressHandler()).forEach(([key, value]) => {
        container.addEventListener(key.replace('on', '').toLowerCase(), value as EventListener);
      });
    }

    const handleMapClick = () => {
      closeMenu();
    };

    map.on('contextmenu', handleRightClick);
    map.on('touchstart', handleTouchStart);
    map.on('click', handleMapClick);

    const handleModalClose = () => {
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
    };

    // Add a listener to the document to detect modal closures
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handleModalClose();
        closeMenu();
      }
    });

    return () => {
      map.off('contextmenu', handleRightClick);
      map.off('touchstart', handleTouchStart);
      map.off('click', handleMapClick);

      if (isMobile() && map.getContainer()) {
        const container = map.getContainer();
        Object.entries(longPressHandler()).forEach(([key, value]) => {
          container.removeEventListener(
            key.replace('on', '').toLowerCase(),
            value as EventListener
          );
        });
      }

      document.removeEventListener('keydown', e => {
        if (e.key === 'Escape') {
          handleModalClose();
          closeMenu();
        }
      });
    };
  }, [
    mapRef,
    shouldInitializeFeatures,
    tempMarker,
    openModal,
    isMarkersEnabled,
    addMarker,
    handleCloseModal,
    createMarkerModal,
    createNewMarker,
    lastLngLat,
    longPressHandler,
    closeMenu,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) {
      console.log('[SavedLocations EFFECT] Map not ready or features not init.');
      return;
    }

    const eventHandler = (e: mapboxgl.MapMouseEvent) => {
      handleMapClickForMeasurementRef.current(e);
    };

    if (isMeasuring) {
      console.log(
        '[SavedLocations EFFECT] ADDING click listener for measurement (isMeasuring is true).'
      );
      map.on('click', eventHandler);
    } else {
      console.log('[SavedLocations EFFECT] NOT adding listener (isMeasuring is false).');
    }

    return () => {
      console.log('[SavedLocations EFFECT CLEANUP] REMOVING click listener for measurement.');
      map.off('click', eventHandler);
    };
  }, [isMeasuring, mapRef, shouldInitializeFeatures]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMeasuring) {
          exitMeasureMode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMeasuring, exitMeasureMode]);

  return (
    <>
      {menuPosition && menuLngLat && (
        <MapMenu
          coordinates={formatCoordinates(menuLngLat)}
          position={menuPosition}
          lngLat={menuLngLat}
          onClose={closeMenu}
          onSave={createNewMarker}
          onMeasureDistance={startMeasureDistance}
          onAction={action => console.log('Action:', action)}
        />
      )}

      {isMeasuring && (
        <div className="absolute bottom-4 right-4 p-2 rounded z-10">
          <button
            className="shadow px-3 py-1 bg-rose-700 text-white rounded hover:bg-rose-600 text-sm"
            onClick={exitMeasureMode}
          >
            Cancel Measurement
          </button>
        </div>
      )}
    </>
  );
};

export default SavedLocations;
