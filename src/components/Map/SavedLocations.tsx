import React, { useEffect, useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from '../../context/MapContext';
import { useUIContext } from '../../context/UIContext';
import { useCatalogContext } from '../../context/CatalogContext';

const SavedLocations: React.FC = () => {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const { openModal, closeModal } = useUIContext();
  const [tempMarker, setTempMarker] = useState<mapboxgl.Marker | null>(null);
  const { markers, addMarker, deleteMarker, setMarkers, isMarkersEnabled } = useCatalogContext();

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

      Object.values(markersRef.current).forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.error('Error removing marker:', error);
        }
      });

      markersRef.current = {};
    }
  }, [isMarkersEnabled, tempMarker, setMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (!isMarkersEnabled) return;

    markers.forEach(markerData => {
      const marker = new mapboxgl.Marker().setLngLat(markerData.coordinates).addTo(map);

      const popup = new mapboxgl.Popup({
        offset: 25,
        className: 'marker-popup',
        closeButton: true,
        closeOnClick: false,
      }).setHTML(`
          <div class="marker-popup-content">
            <h3 class="font-bold text-md">${markerData.name}</h3>
            <p class="text-sm">${markerData.description}</p>
            <div class="mt-2">
              <button class="delete-location text-xs text-white bg-red-500 px-2 py-1 rounded" data-id="${markerData.id}">
                Delete
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

    const setupDeleteListeners = () => {
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

      document.querySelectorAll('.marker-popup-content').forEach(content => {
        content.addEventListener('click', e => {
          e.stopPropagation();
        });
      });
    };

    map.on('click', () => {
      setTimeout(setupDeleteListeners, 100);
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    if (!isMarkersEnabled) {
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
      return;
    }

    const handleDoubleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isMarkersEnabled) return;

      e.preventDefault();

      if (tempMarker) {
        tempMarker.remove();
      }

      const newTempMarker = new mapboxgl.Marker({ scale: 0.9, color: '#7D00B8' })
        .setLngLat(e.lngLat)
        .addTo(map);

      setTempMarker(newTempMarker);

      const modalContent = (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Add New Location</h2>
          <p className="mb-4">
            Coordinates: {e.lngLat.lng.toFixed(5)}, {e.lngLat.lat.toFixed(5)}
          </p>

          <form
            onSubmit={event => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;

              if (name) {
                addMarker(name, description, [e.lngLat.lng, e.lngLat.lat]);

                if (newTempMarker) {
                  newTempMarker.remove();
                  setTempMarker(null);
                }

                closeModal();
              }
            }}
          >
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 font-medium">
                Location Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block mb-2 font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="w-full p-2 border rounded-md resize-none h-24"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  newTempMarker.remove();
                  setTempMarker(null);
                  closeModal();
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Save Location
              </button>
            </div>
          </form>
        </div>
      );

      openModal(modalContent, { hasAutoHeight: true });
    };

    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('dblclick', handleDoubleClick);
    };
  }, [
    mapRef,
    shouldInitializeFeatures,
    tempMarker,
    openModal,
    closeModal,
    isMarkersEnabled,
    addMarker,
  ]);

  return null;
};

export default SavedLocations;
