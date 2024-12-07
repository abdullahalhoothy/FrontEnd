import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./MapContainer.css";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";
import mapConfig from "../../mapConfig.json";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import { CustomProperties, CityBorders, CityData } from "../../types/allTypesAndInterfaces";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import PolygonsProvider, {
  usePolygonsContext,
} from "../../context/PolygonsContext";
import { StylesControl } from "./StylesControl";
import { CircleControl } from "./CircleControl";

import { generatePopupContent } from "./generatePopupContent";
import StatisticsPopups from "./StatisticsPopups";
import BenchmarkControl from "./BenchmarkControl";
import apiRequest from "../../services/apiRequest";
import urls from "../../urls.json";
import { useUIContext } from "../../context/UIContext";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const getCityBoundaries = async (cityName: string): Promise<[number, number][] | null> => {
  try {
    const cityRes = await apiRequest({
      url: urls.country_city,
      method: "get",
      isAuthRequest: false
    });

    const allCities = Object.values(cityRes.data.data).flat() as Array<{
      name: string;
      borders: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    }>;

    const cityData = allCities.find(city =>
      city.name.toLowerCase() === cityName.toLowerCase()
    );

    if (cityData) {
      const boundingBox = [
        [cityData.borders.southwest.lng, cityData.borders.northeast.lat],
        [cityData.borders.northeast.lng, cityData.borders.northeast.lat],
        [cityData.borders.northeast.lng, cityData.borders.southwest.lat],
        [cityData.borders.southwest.lng, cityData.borders.southwest.lat],
        [cityData.borders.southwest.lng, cityData.borders.northeast.lat]
      ] as [number, number][];

      return boundingBox;
    }

    console.warn("City not found:", cityName);
    return null;
  } catch (error) {
    console.error("Error fetching city boundaries:", error);
    return null;
  }
};

function Container() {
  const { polygons, setPolygons } = usePolygonsContext();
  const {
    geoPoints,
    setGeoPoints,
    isAdvanced,
    openDropdownIndices,
    colors,
    gradientColorBasedOnZone,
    selectedBasedon,
  } = useCatalogContext();
  const { centralizeOnce, initialFlyToDone, setInitialFlyToDone, reqFetchDataset } =
    useLayerContext();
  const { isMobile } = useUIContext();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const styleLoadedRef = useRef(false);
  const lastCoordinatesRef = useRef<[number, number] | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [currentStyle, setCurrentStyle] = useState(
    "mapbox://styles/mapbox/streets-v11"
  );
  const [layerColors, setLayerColors] = useState({});
  const currentDrawMode = useRef<string>('simple_select');
  const [cityBoundaries, setCityBoundaries] = useState<[number, number][] | null>(null);

  useEffect(function () {
    if (mapContainerRef.current && !mapRef.current) {
      if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
          (): void => { },
          true // Lazy load the plugin only when text is in arabic
        );
      }

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: currentStyle,
        center: mapConfig.center as [number, number],
        attributionControl: true,
        zoom: mapConfig.zoom,
      });

      const stylesControl = new StylesControl(currentStyle, setCurrentStyle);
      mapRef.current.addControl(stylesControl, "top-right");

      // Add Navigation Control
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      // Set an id for the navigation control
      const navControlContainer = mapRef.current
        .getContainer()
        .querySelector(".mapboxgl-ctrl-top-right .mapboxgl-ctrl-group");
      if (navControlContainer) {
        navControlContainer.setAttribute("id", "navigation-control");
      }

      let modes = MapboxDraw.modes;

      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          point: false,
          line_string: false,
          polygon: true,
          trash: true,
        },
        defaultMode: "simple_select",
        modes: {
          ...modes,
          simple_select: { ...MapboxDraw.modes.simple_select, dragMove() { } },
          direct_select: {
            ...MapboxDraw.modes.direct_select,
            dragVertex(state, e, delta) {
              const feature = state.feature;
              if (feature.properties?.shape !== "circle") {
                MapboxDraw.modes.direct_select.dragVertex.call(
                  this,
                  state,
                  e,
                  delta
                );
              }
            },
          },
        },
      });

      mapRef.current.on("draw.create", (e) => {
        console.log(e);
        const geojson = e.features[0];
        geojson.isStatisticsPopupOpen = false;
        setPolygons((prev: any) => {
          return [...prev, geojson];
        });
      });

      mapRef.current.on("draw.update", (e) => {
        const geojson = e.features[0];
        const updatedPolygonsId = e.features[0].id;
        geojson.isStatisticsPopupOpen = false;
        setPolygons((prev: any) => {
          return prev.map((polygon: any) => {
            return polygon.id === updatedPolygonsId ? geojson : polygon;
          });
        });
      });

      mapRef.current.on("draw.delete", (e) => {
        const deletedPolygonsId = e.features[0].id;
        setPolygons((prev: any) => {
          return prev.filter((polygon: any) => {
            return polygon.id !== deletedPolygonsId;
          });
        });
      });

      mapRef.current.on("draw.move", (e) => {
        const geojson = e.features[0];
      });

      mapRef.current.on("styledata", function () {
        styleLoadedRef.current = true;
      });
    }

    return function () {
      if (draw.current) {
        mapRef.current?.removeControl(draw.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      if (styleLoadedRef.current) {
        styleLoadedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && draw.current) {
      const circleControl = new CircleControl(
        mapRef.current,
        draw.current,
        isMobile
      );

      // Add controls
      mapRef.current.addControl(circleControl, "top-right");
      mapRef.current.addControl(draw.current);

      return () => {
        // Cleanup controls properly
        if (mapRef.current) {
          if (mapRef.current.hasControl(circleControl)) {
            mapRef.current.removeControl(circleControl);
          }
          mapRef.current.removeControl(draw.current);
        }
      };
    }
  }, [isMobile]);

  function getColorsArray(colorHex, index) {
    const array = colors?.find((arr) => arr.includes(colorHex));
    return array[index];
  }

  const addGeoPoints = useCallback(async () => {
    if (!mapRef.current || !styleLoadedRef.current) return;

    try {
      if (!mapRef.current.isStyleLoaded()) {
        mapRef.current.once('style.load', () => {
          addGeoPoints();
        });
        return;
      }

      const existingLayers = mapRef.current.getStyle()?.layers || [];
      existingLayers.forEach((layer: any) => {
        if (layer.id.startsWith('circle-layer-')) {
          const sourceId = `circle-source-${layer.id.split('-')[2]}`;
          if (mapRef.current?.getLayer(layer.id)) {
            mapRef.current.removeLayer(layer.id);
          }
          if (mapRef.current?.getSource(sourceId)) {
            mapRef.current.removeSource(sourceId);
          }
        }
      });

      for (const [index, featureCollection] of geoPoints.entries()) {
        try {
          const sourceId = `circle-source-${index}`;
          const layerId = `circle-layer-${index}`;

          if (!featureCollection.display) continue;

          if (!mapRef.current?.getLayer(layerId)) {
            if (!mapRef.current?.getSource(sourceId)) {
              mapRef.current?.addSource(sourceId, {
                type: "geojson",
                data: featureCollection,
                generateId: true,
              });
            }

            const layerConfig = {
              id: layerId,
              source: sourceId,
              layout: {
                'z-index': featureCollection.is_heatmap ? 1 : 
                           featureCollection.is_grid ? 1 : 2  // Circle layers get higher z-index
              },
            };

            if (featureCollection.is_heatmap) {
              mapRef.current.addLayer({
                ...layerConfig,
                type: "heatmap",
                paint: {
                  "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["get", featureCollection.basedon || "heatmap_weight"],
                    0, 0,
                    5, 1
                  ],
                  "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(33,102,172,0)",
                    0.2, featureCollection.points_color || mapConfig.defaultColor,
                    0.4, "rgb(209,229,240)",
                    0.6, "rgb(253,219,199)",
                    0.8, "rgb(239,138,98)",
                    1, "rgb(178,24,43)"
                  ]
                }
              });
            } else if (featureCollection.is_grid) {
              console.log("Grid mode - FeatureCollection:", {
                hasCity: 'city_name' in featureCollection,
                cityName: featureCollection.city_name,
                featureCollection
              });
              
              const cityBounds = await getCityBoundaries(featureCollection.city_name || reqFetchDataset.selectedCity);
              console.log("Retrieved city bounds for:", featureCollection.city_name, cityBounds);
              
              let bounds: [number, number, number, number];
              if (cityBounds) {
                const lngs = cityBounds.map(coord => coord[0]);
                const lats = cityBounds.map(coord => coord[1]);
                bounds = [
                  Math.min(...lngs),
                  Math.min(...lats),
                  Math.max(...lngs),
                  Math.max(...lats)
                ];
              } else {
                bounds = turf.bbox(featureCollection).slice(0, 4) as [number, number, number, number];
              }

              const cellSide = (featureCollection.radius_meters || 1000) / 1000;
              const options = { units: 'kilometers' as const };
              const grid = turf.squareGrid(bounds, cellSide, options);

              grid.features = grid.features.map(cell => {
                const pointsWithin = turf.pointsWithinPolygon(featureCollection, cell);
                const density = pointsWithin.features.reduce((sum, point) => {
                  const value = point.properties[featureCollection.basedon || 'rating'];
                  return sum + (typeof value === 'number' ? value : 0);
                }, 0);
                
                return {
                  ...cell,
                  properties: {
                    ...cell.properties,
                    density
                  }
                };
              });

              // Add or update grid source
              const gridSourceId = `${sourceId}-grid`;
              const source = mapRef.current?.getSource(gridSourceId) as GeoJSONSource;
              if (source) {
                source.setData(grid);
              } else {
                mapRef.current?.addSource(gridSourceId, {
                  type: "geojson",
                  data: grid
                });
              }

              // Add grid visualization layer
              if (!mapRef.current?.getLayer(`${layerId}-fill`)) {
                const allDensityValues = grid.features.map(cell => cell?.properties?.density ?? 0);
                const maxDensity = Math.max(...allDensityValues);

                const p25 = maxDensity * 0.25;
                const p50 = maxDensity * 0.50;
                const p75 = maxDensity * 0.75;

                mapRef.current?.addLayer({
                  id: `${layerId}-fill`,
                  type: "fill",
                  source: gridSourceId,
                  paint: {
                    'fill-color': featureCollection.points_color || mapConfig.defaultColor,
                    'fill-opacity': [
                      'case',
                      ['==', ['get', 'density'], 0], 
                      0,
                      [
                        'step',
                        ['get', 'density'],
                        0.2,
                        p25, 0.4,
                        p50, 0.6,
                        p75, 0.8
                      ]
                    ],
                    'fill-outline-color': [
                      'case',
                      ['==', ['get', 'density'], 0],
                      'rgba(0,0,0,0)',
                      '#000'
                    ]
                  },
                  filter: ['>=', ['get', 'density'], 0]
                });
              }
            } else {
              const allValues = featureCollection.features.map(f => 
                Number(f.properties[featureCollection.basedon || 'rating']) || 0
              );
              const maxValue = Math.max(...allValues);
              
              const p25 = maxValue * 0.25;
              const p50 = maxValue * 0.50;
              const p75 = maxValue * 0.75;

              mapRef.current?.addLayer({
                id: layerId,
                type: "circle",
                source: sourceId,
                paint: {
                  'circle-color': [
                    'step',
                    ['get', featureCollection.basedon || 'rating'],
                    featureCollection.points_color || mapConfig.defaultColor,
                    p25, featureCollection.points_color || mapConfig.defaultColor,
                    p50, featureCollection.points_color || mapConfig.defaultColor,
                    p75, featureCollection.points_color || mapConfig.defaultColor
                  ],
                  "circle-radius": [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    mapConfig.hoverCircleRadius,
                    mapConfig.circleRadius,
                  ],                  'circle-opacity': [
                    'step',
                    ['get', featureCollection.basedon || 'rating'],
                    0.2,
                    p25, 0.4,
                    p50, 0.6,
                    p75, 0.8
                  ]
                }
              });
            }
          }

          let hoveredStateId: number | null = null;
          let popup: mapboxgl.Popup | null = null;
          let isOverPopup = false;
          let isOverPoint = false;

          const handleMouseOver = async (
            e: mapboxgl.MapMouseEvent & mapboxgl.EventData
          ) => {
            if (!mapRef.current) return;
            isOverPoint = true;
            // Update cursor style
            mapRef.current.getCanvas().style.cursor = "";

            // Check if there are features
            if (e.features && e.features.length > 0) {
              if (hoveredStateId !== null) {
                mapRef.current.setFeatureState(
                  { source: sourceId, id: hoveredStateId },
                  { hover: false }
                );
              }

              hoveredStateId = e.features[0].id as number;
              mapRef.current.setFeatureState(
                { source: sourceId, id: hoveredStateId },
                { hover: true }
              );

              const coordinates = (
                e.features[0].geometry as any
              ).coordinates.slice();
              const properties = e.features[0]
                .properties as CustomProperties;

              // Show loading spinner in the popup while fetching content
              const loadingContent = generatePopupContent(
                properties,
                coordinates,
                true,
                false
              );

              // Remove previous popup if it exists
              if (popup) {
                popup.remove();
              }

              // Create and add new popup
              popup = new mapboxgl.Popup({
                closeButton: isMobile,
              })
                .setLngLat(coordinates)
                .setHTML(loadingContent) // Initially show loading spinner
                .addTo(mapRef.current!);
              const [lng, lat] = coordinates;
              // const url = `https://maps.googleapis.com/maps/api/streetview?return_error_code=true&size=600x300&location=${lat},${lng}&heading=151.78&pitch=-0.76&key=${
              //   import.meta.env.VITE_GOOGLE_MAPS_API_KEY
              // }`;
              try {
                const response = await apiRequest({
                  url: urls.check_street_view,
                  method: "POST",
                  body: {
                    lat: lat,
                    lng: lng,
                  },
                });
                // Once data is fetched, update the popup with the actual content
                const updatedContent = generatePopupContent(
                  properties,
                  coordinates,
                  false,
                  true
                );
                popup.setHTML(updatedContent).addTo(mapRef.current!);
              } catch (error) {
                popup.setHTML(
                  generatePopupContent(
                    properties,
                    coordinates,
                    false,
                    false
                  )
                );
              }

              // Add mouseenter and mouseleave events to the popup element
              const popupElement = popup.getElement();
              popupElement.addEventListener("mouseenter", () => {
                isOverPopup = true;
              });
              popupElement.addEventListener("mouseleave", () => {
                isOverPopup = false;
                if (!hoveredStateId) {
                  popup?.remove();
                  popup = null;
                }
              });
            }
          };

          const handleMouseLeave = () => {
            if (!mapRef.current) return;
            isOverPoint = false;
            // Reset cursor style
            mapRef.current.getCanvas().style.cursor = "";

            // Use setTimeout to check if the mouse is over the popup before closing
            setTimeout(() => {
              if (!isOverPopup && !isOverPoint && popup) {
                popup.remove();
                popup = null;
              }
            }, 500);

            if (hoveredStateId !== null) {
              mapRef.current.setFeatureState(
                { source: sourceId, id: hoveredStateId },
                { hover: false }
              );
            }

            hoveredStateId = null;
          };

          if (mapRef.current) {
            if (isMobile) {
              // For mobile devices, use touchstart and touchend events
              mapRef.current.on("touchstart", layerId, handleMouseOver);
            } else {
              // For desktop, keep original mouseenter and mouseleave events
              mapRef.current.on("mouseenter", layerId, handleMouseOver);
              mapRef.current.on("mouseleave", layerId, handleMouseLeave);
            }
          }

          if (
            index === geoPoints.length - 1 &&
            featureCollection.features.length
          ) {
            const lastFeature =
              featureCollection.features[
              featureCollection.features.length - 1
              ];
            const newCoordinates = lastFeature.geometry.coordinates as [
              number,
              number
            ];

            if (centralizeOnce && !initialFlyToDone && mapRef.current) {
              mapRef.current.flyTo({
                center: newCoordinates,
                zoom: mapConfig.zoom,
                speed: mapConfig.speed,
                curve: 1,
              });
              lastCoordinatesRef.current = newCoordinates;
              setInitialFlyToDone(true);
            } else if (
              JSON.stringify(newCoordinates) !==
              JSON.stringify(lastCoordinatesRef.current)
            ) {
              if (!centralizeOnce && mapRef.current) {
                mapRef.current.flyTo({
                  center: newCoordinates,
                  zoom: mapConfig.zoom,
                  speed: mapConfig.speed,
                  curve: 1,
                });
              }
              lastCoordinatesRef.current = newCoordinates;
            }
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('style.load', setupMap);

        if (mapRef.current.isStyleLoaded()) {
          try {
            const style = mapRef.current.getStyle();
            if (style && style.layers) {
              style.layers.forEach((layer: any) => {
                if (layer.id.startsWith('circle-layer-')) {
                  const sourceId = `circle-source-${layer.id.split('-')[2]}`;
                  if (mapRef.current?.getLayer(layer.id)) {
                    mapRef.current.removeLayer(layer.id);
                  }
                  if (mapRef.current?.getSource(sourceId)) {
                    mapRef.current.removeSource(sourceId);
                  }
                }
              });
            }
          } catch (error) {
            console.error('Error during cleanup:', error);
          }
        } else {
          console.warn('Style is not fully loaded yet. Cleanup skipped.');
        }
      }
    }
  }, [geoPoints, initialFlyToDone, centralizeOnce, isMobile]);

  // Select polygons when clicked on the map
  useEffect(() => {
    const handleMapClick = (e) => {
      const coordinates = e.lngLat;
      const point = [coordinates.lng, coordinates.lat];

      const polygon = polygons.find((polygon) => {
        try {
          let turfPolygon;
          if (polygon.geometry.type === "Polygon") {
            turfPolygon = turf.polygon(polygon.geometry.coordinates);
          } else if (polygon.geometry.type === "MultiPolygon") {
            turfPolygon = turf.multiPolygon(polygon.geometry.coordinates);
          } else {
            console.error("Unsupported geometry type:", polygon.geometry.type);
            return false;
          }

          return turf.booleanPointInPolygon(point, turfPolygon);
        } catch (error) {
          console.error("Error processing polygon:", error);
          return false;
        }
      });

      if (polygon) {
        const pixelPosition = mapRef.current.project(coordinates);
        polygon.pixelPosition = pixelPosition;
        setPolygons((prev) => {
          return prev.map((prevPolygon) => {
            if (prevPolygon.id === polygon.id) {
              return {
                ...prevPolygon,
                isStatisticsPopupOpen: !prevPolygon.isStatisticsPopupOpen,
                pixelPosition,
              };
            }
            return prevPolygon;
          });
        });
      }
    };

    if (mapRef.current) {
      if (isMobile) {
        mapRef.current.on("touchend", handleMapClick);
      } else {
        mapRef.current.on("click", handleMapClick);
      }
    }

    // Cleanup listener on unmount or polygon change
    return () => {
      if (mapRef.current) {
        if (isMobile) {
          mapRef.current.off("touchend", handleMapClick);
        } else {
          mapRef.current.off("click", handleMapClick);
        }
      }
    };
  }, [polygons, isMobile]);

  // Create or update the legend based on the geoPoints data
  useEffect(() => {
    if (mapRef.current && styleLoadedRef.current && geoPoints.length > 0) {
      const hasAtLeastOneValidName = geoPoints.some(
        (point) => point.layer_legend
      );
      if (!hasAtLeastOneValidName) {
        legendRef.current?.remove();
        return;
      }

      if (legendRef.current) {
        legendRef.current.innerHTML = `<h4 class="text-sm font-semibold text-gray-900 border-b p-2">Legend</h4>`;

        geoPoints.forEach((point, index) => {
          if (!point.display) {
            return;
          }
          if (!point.layer_legend) {
            return;
          }
          const item = document.createElement("div");
          item.className = "px-2.5 py-1.5 flex items-center gap-2";
          item.innerHTML = `
          <div class="w-3 h-3 rounded-full" style="background-color: ${point.points_color || mapConfig.defaultColor}"></div>
          <span class="text-sm">${point.layer_legend || "Unnamed"}</span>`;
          legendRef.current.appendChild(item);
        });
        mapRef.current.getContainer().appendChild(legendRef.current);
      } else {
        legendRef.current = document.createElement("div");
        legendRef.current.className =
          "absolute bottom-[10px] right-[10px] z-10 bg-white border shadow h-48 min-w-48 rounded-md";
        legendRef.current.innerHTML = `<h4 class="text-sm font-semibold text-gray-900 border-b p-2">Legend</h4>`;
        geoPoints.forEach((point, index) => {
          if (!point.display) {
            return;
          }
          if (!point.layer_legend) {
            return;
          }
          const item = document.createElement("div");
          item.className = "px-2.5 py-1.5 flex items-center gap-2";
          item.innerHTML = `
          <div class="w-3 h-3 rounded-full" style="background-color: ${point.points_color || mapConfig.defaultColor}"></div>
          <span class="text-sm">${point.layer_legend || "Unnamed"}</span>`;
          legendRef.current.appendChild(item);
        });
        mapRef.current?.getContainer().appendChild(legendRef.current);
      }

      const hasAtLeastOneDisplayedPoint = geoPoints.some(
        (point) => point.display
      );
      if (geoPoints.length === 0 || !hasAtLeastOneDisplayedPoint) {
        if (legendRef.current) {
          legendRef.current.style.display = "none";
        }
      } else {
        if (legendRef.current) {
          legendRef.current.style.display = "block";
        }
      }
    }

    return () => {
      if (legendRef.current) {
        legendRef.current.remove();
      }
    };
  }, [geoPoints]);

  // Update the geoPoints data when the style is loaded for the first time or changed
  useEffect(() => {
    if (mapRef.current && styleLoadedRef.current) {
      mapRef.current.once("styledata", () => {
        setGeoPoints((prevGeoPoints) => {
          return prevGeoPoints.map((layer) => {
            return Object.assign({}, layer);
          });
        });
      });
    }
  }, [currentStyle]);

  const setupMap = () => {
    if (mapRef.current && styleLoadedRef.current) {
      addGeoPoints();
    }
  };

  useEffect(() => {
    setupMap();
  }, [geoPoints, initialFlyToDone, centralizeOnce, isMobile]);

  return (
    <div className="flex-1 relative " id="map-container">
      <div
        className="lg:absolute w-full h-full overflow-hidden"
        id="map-container"
        ref={mapContainerRef}
      />
      <StatisticsPopups />
      {mapRef.current && styleLoadedRef.current && <BenchmarkControl />}
    </div>
  );
}

function MapContainer() {
  return (
    <PolygonsProvider>
      <Container />
    </PolygonsProvider>
  );
}

export default MapContainer;