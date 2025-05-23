import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import apiRequest from '../services/apiRequest';
import urls from '../urls.json';
import { useMapContext } from '../context/MapContext';
import { toast } from 'sonner';

export interface MeasurementState {
  isMeasuring: boolean;
  measureSourcePoint: mapboxgl.LngLat | null;
  measureDestinationPoint: mapboxgl.LngLat | null;
  measurementResult: any | null;
  measureMarkers: mapboxgl.Marker[];
  measureLine: any | null;
  previewLine: any | null;
  measurementPopup: mapboxgl.Popup | null;
}

export interface MeasurementActions {
  initializeMeasureMode: () => void;
  exitMeasureMode: () => void;
  handleMapClickForMeasurement: (e: mapboxgl.MapMouseEvent) => Promise<void>;
  clearMeasurementLayers: () => void;
  displayRouteOnMap: (polygonData: any) => void;
  decodePolyline: (encoded: string) => [number, number][];
}

export const useMeasurement = (): MeasurementState & MeasurementActions => {
  const { mapRef, shouldInitializeFeatures } = useMapContext();

  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measureSourcePoint, setMeasureSourcePoint] = useState<mapboxgl.LngLat | null>(null);
  const [measureDestinationPoint, setMeasureDestinationPoint] = useState<mapboxgl.LngLat | null>(
    null
  );
  const [measurementResult, setMeasurementResult] = useState<any | null>(null);
  const [measureMarkers, setMeasureMarkers] = useState<mapboxgl.Marker[]>([]);
  const measureMarkersRef = useRef<mapboxgl.Marker[]>(measureMarkers);
  const [measureLine, setMeasureLine] = useState<any | null>(null);
  const [previewLine, setPreviewLine] = useState<any | null>(null);
  const [measurementPopup, setMeasurementPopup] = useState<mapboxgl.Popup | null>(null);

  useEffect(() => {
    measureMarkersRef.current = measureMarkers;
  }, [measureMarkers]);

  const clearMeasurementLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource('measure-line')) {
      map.removeLayer('measure-line-layer');
      map.removeSource('measure-line');
    }

    if (map.getSource('preview-line')) {
      map.removeLayer('preview-line-layer');
      map.removeSource('preview-line');
    }

    if (map.getSource('measure-route')) {
      map.removeLayer('measure-route-line');
      map.removeSource('measure-route');
    }

    if (map.getSource('measure-polygon')) {
      map.removeLayer('measure-polygon-fill');
      map.removeLayer('measure-polygon-outline');
      map.removeSource('measure-polygon');
    }

    setMeasureLine(null);
    setPreviewLine(null);
  }, [mapRef]);

  const initializeMeasureMode = useCallback(() => {
    setIsMeasuring(true);
    setMeasureSourcePoint(null);
    setMeasureDestinationPoint(null);
    setMeasurementResult(null);

    measureMarkersRef.current.forEach(marker => marker.remove());
    setMeasureMarkers([]);

    if (measurementPopup) {
      measurementPopup.remove();
      setMeasurementPopup(null);
    }

    clearMeasurementLayers();

    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = 'crosshair';
    }
  }, [mapRef, measurementPopup, clearMeasurementLayers]);

  const exitMeasureMode = useCallback(() => {
    setIsMeasuring(false);
    setMeasureSourcePoint(null);
    setMeasureDestinationPoint(null);
    setMeasurementResult(null);

    measureMarkersRef.current.forEach(marker => marker.remove());
    setMeasureMarkers([]);

    document.querySelectorAll('.loading-popup').forEach(el => el.remove());

    if (measurementPopup) {
      measurementPopup.remove();
      setMeasurementPopup(null);
    }

    clearMeasurementLayers();

    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = '';
    }
  }, [mapRef, measurementPopup, clearMeasurementLayers]);

  const calculateDistance = (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const decodePolyline = (encoded: string): [number, number][] => {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lng * 1e-5, lat * 1e-5]);
    }

    return coordinates;
  };

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360); // Random hue (0-359)
    return `hsl(${hue}, 70%, 60%)`; // Use HSL for better control over brightness/saturation
  };

  const displayRouteOnMap = useCallback(
    (polygonData: any) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const routeColor = generateRandomColor();

      if (map.getSource('measure-route')) {
        map.removeLayer('measure-route-line');
        map.removeSource('measure-route');
      }

      try {
        map.addSource('measure-route', {
          type: 'geojson',
          data: polygonData,
        });

        map.addLayer({
          id: 'measure-route-line',
          type: 'line',
          source: 'measure-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColor,
            'line-width': 4,
          },
        });
      } catch (error) {
        console.error('Error displaying route:', error);
      }
    },
    [mapRef]
  );

  const showLoadingIndicator = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat) => {
      if (!mapRef.current) return null;

      const midpoint = new mapboxgl.LngLat(
        (point1.lng + point2.lng) / 2,
        (point1.lat + point2.lat) / 2
      );

      if (measurementPopup) {
        measurementPopup.remove();
        setMeasurementPopup(null);
      }

      const existingLoadingPopups = document.querySelectorAll('.loading-popup');
      existingLoadingPopups.forEach(popup => {
        const popupInstance = (popup as any)._mapboxgl_popup;
        if (popupInstance && popupInstance.remove) {
          popupInstance.remove();
        } else {
          popup.remove();
        }
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'measure-popup loading-popup',
      })
        .setLngLat(midpoint)
        .setHTML(
          `
        <div class="p-2 flex items-center bg-white rounded-lg shadow-sm">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          <span>Calculating route...</span>
        </div>
      `
        )
        .addTo(mapRef.current);

      setMeasurementPopup(popup);
      return popup;
    },
    [mapRef, measurementPopup]
  );

  const showApiMeasurementResult = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat, apiResult: any) => {
      if (!mapRef.current) return null;

      const midpoint = new mapboxgl.LngLat(
        (point1.lng + point2.lng) / 2,
        (point1.lat + point2.lat) / 2
      );

      let formattedDistance = 'N/A';
      let formattedDuration = 'N/A';

      const distance = apiResult.data?.distance_in_km;
      const duration = apiResult.data?.drive_time_in_min;

      if (distance) {
        formattedDistance = `${typeof distance === 'number' ? distance.toFixed(2) : distance} km`;
      }

      if (duration) {
        const durationInMinutes = Math.round(
          typeof duration === 'number' ? duration : parseFloat(duration)
        );
        formattedDuration =
          durationInMinutes < 60
            ? `${durationInMinutes} min`
            : `${Math.floor(durationInMinutes / 60)} hr ${durationInMinutes % 60} min`;
      }

      if (measurementPopup) {
        measurementPopup.remove();
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'measure-popup result-popup',
        maxWidth: '300px',
        offset: 20,
      })
        .setLngLat(midpoint)
        .setHTML(
          `
          <div class="p-3 bg-white rounded-lg shadow-md">
            <h3 class="font-bold text-sm mb-2">Route Information&nbsp;&nbsp;&nbsp;</h3>
            <div class="text-sm">
              <div class="flex justify-between mb-1">
                <b>Distance:</b>
                <span class="font-medium">${formattedDistance}</span>
              </div>
              <div class="flex justify-between">
                <b>Duration:</b>
                <span class="font-medium">${formattedDuration}</span>
              </div>
            </div>
          </div>
        `
        )
        .addTo(mapRef.current);

      const popupElement = popup.getElement();
      popupElement.addEventListener('exit-measurement', () => {
        popup.remove();
        setMeasurementPopup(null);
        exitMeasureMode();
      });

      popup.on('close', () => {
        exitMeasureMode();
      });

      setMeasurementPopup(popup);

      setIsMeasuring(false);

      return popup;
    },
    [mapRef, measurementPopup, exitMeasureMode]
  );

  const showMeasurementResult = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat, distance: number, errorMessage?: string) => {
      if (!mapRef.current) return null;

      const midpoint = new mapboxgl.LngLat(
        (point1.lng + point2.lng) / 2,
        (point1.lat + point2.lat) / 2
      );

      let formattedDistance: string;
      if (distance >= 1000) {
        formattedDistance = `${(distance / 1000).toFixed(2)} km`;
      } else {
        formattedDistance = `${Math.round(distance)} m`;
      }

      if (measurementPopup) {
        measurementPopup.remove();
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'measure-popup',
      })
        .setLngLat(midpoint)
        .setHTML(
          `
          <div class="p-3 bg-white rounded-lg shadow-md">
            <div class="text-sm">
              <strong>Distance:</strong> ${formattedDistance}
              ${errorMessage ? `<div class="text-red-500 text-xs mt-1">${errorMessage}</div>` : ''}
            </div>
            <div class="mt-3 flex justify-end">
              <button
                class="exit-measure-mode-hook px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                onclick="this.dispatchEvent(new CustomEvent('exit-measurement', {bubbles: true}))"
              >
                Done
              </button>
            </div>
          </div>
        `
        )
        .addTo(mapRef.current);

      const popupElement = popup.getElement();
      popupElement.addEventListener('exit-measurement', () => {
        popup.remove();
        setMeasurementPopup(null);
        exitMeasureMode();
      });

      popup.on('close', () => {
        exitMeasureMode();
      });

      setMeasurementPopup(popup);

      setIsMeasuring(false);

      return popup;
    },
    [mapRef, measurementPopup, exitMeasureMode]
  );

  const handleMapClickForMeasurement = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      if (!isMeasuring) {
        return;
      }

      if (!measureSourcePoint) {
        setMeasureSourcePoint(e.lngLat);

        const marker = new mapboxgl.Marker({ color: '#FF0000' }).setLngLat(e.lngLat).addTo(map);
        setMeasureMarkers(prev => [...prev, marker]);
      } else if (!measureDestinationPoint) {
        setMeasureDestinationPoint(e.lngLat);

        const marker = new mapboxgl.Marker({ color: '#0000FF' }).setLngLat(e.lngLat).addTo(map);
        setMeasureMarkers(prev => [...prev, marker]);

        const lineColor = generateRandomColor();

        const lineFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [measureSourcePoint.lng, measureSourcePoint.lat],
              [e.lngLat.lng, e.lngLat.lat],
            ],
          },
        };

        if (map.getSource('preview-line')) {
          map.removeLayer('preview-line-layer');
          map.removeSource('preview-line');
        }

        if (map.getSource('measure-line')) {
          (map.getSource('measure-line') as mapboxgl.GeoJSONSource).setData(lineFeature as any);
          map.setPaintProperty('measure-line-layer', 'line-color', lineColor);
        } else {
          map.addSource('measure-line', {
            type: 'geojson',
            data: lineFeature as any,
          });

          map.addLayer({
            id: 'measure-line-layer',
            type: 'line',
            source: 'measure-line',
            paint: {
              'line-color': lineColor,
              'line-width': 2,
              'line-dasharray': [2, 1],
            },
          });
        }

        setMeasureLine(lineFeature);

        const body = {
          source: { lat: measureSourcePoint.lat, lng: measureSourcePoint.lng },
          destination: { lat: e.lngLat.lat, lng: e.lngLat.lng },
        };

        if (measureSourcePoint.lat === e.lngLat.lat && measureSourcePoint.lng === e.lngLat.lng) {
          toast.warning('Measurement API Call: Source and Destination points are identical.', body);
          console.warn('Measurement API Call: Source and Destination points are identical.', body);
        }

        const loadingPopup = showLoadingIndicator(measureSourcePoint, e.lngLat);

        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = ''; // Reset cursor as user input is done
        }

        try {
          const res = await apiRequest({
            url: urls.distance_drive_time_polygon,
            method: 'post',
            isAuthRequest: true,
            body: body,
          });

          const apiData = res.data;

          if (loadingPopup) {
            loadingPopup.remove();
          }

          document.querySelectorAll('.loading-popup').forEach(el => el.remove());

          if (measurementPopup) {
            measurementPopup.remove();
            setMeasurementPopup(null);
          }

          const measurementData = {
            message: apiData.message,
            polygon: apiData.data?.drive_polygon,
            distance: apiData.data?.distance_in_km,
            duration: apiData.data?.drive_time_in_min,
            request_id: apiData.request_id,
          };

          setMeasurementResult(measurementData);

          showApiMeasurementResult(measureSourcePoint, e.lngLat, apiData);

          if (apiData.data?.drive_polygon) {
            try {
              if (typeof apiData.data.drive_polygon === 'string') {
                try {
                  const routeData = JSON.parse(apiData.data.drive_polygon);
                  displayRouteOnMap(routeData);
                } catch (parseError) {
                  console.error('Error parsing route data:', parseError);

                  try {
                    const coordinates = decodePolyline(apiData.data.drive_polygon);
                    const lineStringFeature = {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                      },
                    };
                    displayRouteOnMap(lineStringFeature);
                  } catch (polylineError) {
                    console.error('Error processing polyline:', polylineError);
                  }
                }
              } else {
                displayRouteOnMap(apiData.data.drive_polygon);
              }
            } catch (error) {
              console.error('Error processing route data:', error);
            }
          } else {
            console.log('No route data found in response');
          }
        } catch (error) {
          console.error('Error fetching distance data:', error);

          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = ''; // Reset cursor on error too
          }

          if (loadingPopup) {
            loadingPopup.remove();
          }

          document.querySelectorAll('.loading-popup').forEach(el => el.remove());

          if (measurementPopup) {
            measurementPopup.remove();
            setMeasurementPopup(null);
          }

          const distance = calculateDistance(measureSourcePoint, e.lngLat);

          showMeasurementResult(
            measureSourcePoint,
            e.lngLat,
            distance,
            'API request failed. Showing straight-line distance.'
          );
        }
      }
    },
    [
      mapRef,
      isMeasuring,
      measureSourcePoint,
      measureDestinationPoint,
      measurementPopup,
      showLoadingIndicator,
      showApiMeasurementResult,
      showMeasurementResult,
      displayRouteOnMap,
      decodePolyline,
      calculateDistance,
      generateRandomColor,
    ]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !shouldInitializeFeatures ||
      !isMeasuring ||
      !measureSourcePoint ||
      measureDestinationPoint
    ) {
      return;
    }

    const previewColor = generateRandomColor();

    if (!map.getSource('preview-line')) {
      map.addSource('preview-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [measureSourcePoint.lng, measureSourcePoint.lat],
              [measureSourcePoint.lng, measureSourcePoint.lat],
            ],
          },
        },
      });

      map.addLayer({
        id: 'preview-line-layer',
        type: 'line',
        source: 'preview-line',
        paint: {
          'line-color': previewColor,
          'line-width': 2,
          'line-dasharray': [1, 2],
        },
      });
    }

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!measureSourcePoint || measureDestinationPoint) return;

      const lineFeature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [measureSourcePoint.lng, measureSourcePoint.lat],
            [e.lngLat.lng, e.lngLat.lat],
          ],
        },
      };

      (map.getSource('preview-line') as mapboxgl.GeoJSONSource).setData(lineFeature as any);
      setPreviewLine(lineFeature);
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [
    mapRef,
    shouldInitializeFeatures,
    isMeasuring,
    measureSourcePoint,
    measureDestinationPoint,
    generateRandomColor,
  ]);

  return {
    isMeasuring,
    measureSourcePoint,
    measureDestinationPoint,
    measurementResult,
    measureMarkers,
    measureLine,
    previewLine,
    measurementPopup,

    initializeMeasureMode,
    exitMeasureMode,
    handleMapClickForMeasurement,
    clearMeasurementLayers,
    displayRouteOnMap,
    decodePolyline,
  };
};
