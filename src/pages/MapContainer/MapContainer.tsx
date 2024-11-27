import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./MapContainer.css";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";
import mapConfig from "../../mapConfig.json";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import { CustomProperties } from "../../types/allTypesAndInterfaces";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import PolygonsProvider, {
  usePolygonsContext,
} from "../../context/PolygonsContext";
import axios from "axios";
import { StylesControl } from "./StylesControl";
import { CircleControl } from "./CircleControl";

import { generatePopupContent } from "./generatePopupContent";
import StatisticsPopups from "./StatisticsPopups";
import BenchmarkControl from "./BenchmarkControl";
import apiRequest from "../../services/apiRequest";
import urls from "../../urls.json";
import { useUIContext } from "../../context/UIContext";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

function Container() {
  const { polygons, setPolygons } = usePolygonsContext();
  const {
    geoPoints,
    setGeoPoints,
    isAdvanced,
    openDropdownIndices,
    colors,
    gradientColorBasedOnZone,
  } = useCatalogContext();
  const { centralizeOnce, initialFlyToDone, setInitialFlyToDone } =
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
                // Call the original dragVertex function
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

  useEffect(() => {
    function addGeoPoints() {
      if (mapRef.current && styleLoadedRef.current) {
        const existingLayers = mapRef.current.getStyle().layers;
        const existingLayerIds = existingLayers
          ? existingLayers.map(function (layer: any) {
            return layer.id;
          })
          : [];

        existingLayerIds.forEach(function (layerId: any) {
          if (layerId.startsWith("circle-layer-")) {
            const index = parseInt(layerId.replace("circle-layer-", ""), 10);
            if (!geoPoints[index] || !geoPoints[index].display) {
              if (mapRef.current) {
                mapRef.current.removeLayer(layerId);
                mapRef.current.removeSource("circle-source-" + index);
              }
            }
          }
        });

        geoPoints.forEach(function (featureCollection, index) {
          const sourceId = "circle-source-" + index;
          const layerId = "circle-layer-" + index;

          const existingSource = mapRef.current
            ? (mapRef.current.getSource(sourceId) as GeoJSONSource)
            : null;

          if (featureCollection.display) {
            if (existingSource) {
              existingSource.setData(featureCollection);
              if (mapRef.current) {
                if (featureCollection.is_heatmap) {
                  mapRef.current.removeLayer(layerId);
                  mapRef.current.addLayer({
                    id: layerId,
                    type: "heatmap",
                    source: sourceId,
                    paint: {
                      "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0,
                        "rgba(33,102,172,0)",
                        0.2,
                        featureCollection.points_color ||
                        mapConfig.defaultColor,
                        0.4,
                        "rgb(209,229,240)",
                        0.6,
                        "rgb(253,219,199)",
                        0.8,
                        "rgb(239,138,98)",
                        1,
                        "rgb(178,24,43)",
                      ],
                    },
                  });
                } else {
                  mapRef.current.removeLayer(layerId);
                  mapRef.current.addLayer({
                    id: layerId,
                    type: "circle",
                    source: sourceId,
                    paint: {
                      "circle-radius": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        mapConfig.hoverCircleRadius,
                        mapConfig.circleRadius,
                      ],
                      "circle-color":
                        featureCollection.points_color ||
                        mapConfig.defaultColor,

                      "circle-opacity": mapConfig.circleOpacity,
                      "circle-stroke-width": mapConfig.circleStrokeWidth,
                      "circle-stroke-color": mapConfig.circleStrokeColor,
                    },
                  });
                  if (isAdvanced === true) {
                    if (openDropdownIndices[1] === index) {
                      const newSettings = {
                        points_color: [
                          "case",
                          // Category 1: Rating <= 1
                          ["<=", ["get", "rating"], 1],
                          getColorsArray(
                            featureCollection.points_color ||
                            mapConfig.defaultColor,
                            5
                          ),
                          // Category 2: Rating <= 2
                          ["<=", ["get", "rating"], 2],
                          getColorsArray(
                            featureCollection.points_color ||
                            mapConfig.defaultColor,
                            4
                          ),
                          // Category 3: Rating <= 3
                          ["<=", ["get", "rating"], 3],
                          getColorsArray(
                            featureCollection.points_color ||
                            mapConfig.defaultColor,
                            3
                          ),
                          // Category 4: Rating <= 4
                          ["<=", ["get", "rating"], 4],
                          getColorsArray(
                            featureCollection.points_color ||
                            mapConfig.defaultColor,
                            2
                          ),
                          // Category 5: Rating <= 5
                          ["<=", ["get", "rating"], 5],
                          getColorsArray(
                            featureCollection.points_color ||
                            mapConfig.defaultColor,
                            1
                          ),
                          ["==", ["get", "rating"], 6],
                          getColorsArray(
                            featureCollection.points_color ||
                            mapConfig.defaultColor,
                            0
                          ),

                          // default
                          featureCollection.points_color ||
                          mapConfig.defaultColor,
                        ],
                      };
                      // Save the current color settings to persist them when the dropdown is closed
                      setLayerColors((prevColors) => ({
                        ...prevColors,
                        [layerId]: newSettings?.points_color,
                      }));

                      // Apply the color settings
                      mapRef.current.setPaintProperty(
                        layerId,
                        "circle-color",
                        newSettings.points_color
                      );
                    }
                    // Persist previously applied colors when the dropdown is closed (openDropdownIndices[1] !== index)
                    if (openDropdownIndices[1] !== index) {
                      const lastSavedColors = layerColors[layerId];

                      // If last saved colors are available, apply them to the layer
                      if (lastSavedColors) {
                        mapRef.current.setPaintProperty(
                          layerId,
                          "circle-color",
                          lastSavedColors
                        );
                      }
                    }
                    if (Array.isArray(gradientColorBasedOnZone)) {
                      if (gradientColorBasedOnZone?.length !== 0) {
                        if (
                          geoPoints?.at(1)?.prdcer_lyr_id ==
                          gradientColorBasedOnZone?.at(0)?.prdcer_lyr_id
                        ) {
                          console.log(gradientColorBasedOnZone);
                          const circleColorArray = [
                            "case",
                            gradientColorBasedOnZone?.flatMap(function (
                              layerColor
                            ) {
                              return layerColor?.features?.flatMap(
                                (feature) => {
                                  return [
                                    [
                                      "==",
                                      ["get", "address"],
                                      feature.properties?.address,
                                    ], // Condition
                                    layerColor?.points_color, // Corresponding color
                                  ];
                                }
                              );
                            }),
                            "#FF0000",
                          ];
                          console.log(circleColorArray.flat());
                          mapRef.current.setPaintProperty(
                            "circle-layer-1",
                            "circle-color",
                            circleColorArray.flat()
                          );
                        } else if (
                          geoPoints?.at(0)?.prdcer_lyr_id ==
                          gradientColorBasedOnZone?.at(0)?.prdcer_lyr_id
                        ) {
                          console.log(gradientColorBasedOnZone);
                          const circleColorArray = [
                            "case",
                            gradientColorBasedOnZone?.flatMap(function (
                              layerColor
                            ) {
                              return layerColor?.features?.flatMap(
                                (feature) => {
                                  return [
                                    [
                                      "==",
                                      ["get", "address"],
                                      feature.properties?.address,
                                    ], // Condition
                                    layerColor?.points_color, // Corresponding color
                                  ];
                                }
                              );
                            }),
                            "#FF0000",
                          ];
                          console.log(circleColorArray.flat());
                          mapRef.current.setPaintProperty(
                            "circle-layer-0",
                            "circle-color",
                            circleColorArray.flat()
                          );
                        }
                      }
                    }
                  }
                }
              }
            } else {
              if (mapRef.current) {
                mapRef.current.addSource(sourceId, {
                  type: "geojson",
                  data: featureCollection,
                  generateId: true,
                });

                if (featureCollection.is_heatmap) {
                  mapRef.current.addLayer({
                    id: layerId,
                    type: "heatmap",
                    source: sourceId,
                    paint: {
                      "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0,
                        "rgba(33,102,172,0)",
                        0.2,
                        featureCollection.points_color ||
                        mapConfig.defaultColor,
                        0.4,
                        "rgb(209,229,240)",
                        0.6,
                        "rgb(253,219,199)",
                        0.8,
                        "rgb(239,138,98)",
                        1,
                        "rgb(178,24,43)",
                      ],
                    },
                  });
                } else {
                  mapRef.current.addLayer({
                    id: layerId,
                    type: "circle",
                    source: sourceId,
                    paint: {
                      "circle-radius": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        mapConfig.hoverCircleRadius,
                        mapConfig.circleRadius,
                      ],
                      "circle-color":
                        featureCollection.points_color ||
                        mapConfig.defaultColor,
                      "circle-opacity": mapConfig.circleOpacity,
                      "circle-stroke-width": mapConfig.circleStrokeWidth,
                      "circle-stroke-color": mapConfig.circleStrokeColor,
                    },
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
                    closeButton: false,
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
          }
        });
      }
    }

    if (styleLoadedRef.current) {
      addGeoPoints();
    } else if (mapRef.current) {
      mapRef.current.on("styledata", addGeoPoints);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off("styledata", addGeoPoints);

        geoPoints.forEach(function (featureCollection, index) {
          const sourceId = "circle-source-" + index;
          const layerId = "circle-layer-" + index;

          if (mapRef.current) {
            mapRef.current.removeLayer(layerId);
            mapRef.current.removeSource(sourceId);
          }
        });
      }
    };
  }, [geoPoints, initialFlyToDone, centralizeOnce]);

  // Select polygons when clicked on the map
  useEffect(() => {
    const handleMapClick = (e) => {
      const coordinates = e.lngLat;
      const point = [coordinates.lng, coordinates.lat];

      const polygon = polygons.find((polygon) => {
        try {
          // Ensure polygon coordinates are in the correct format
          let turfPolygon;
          if (polygon.geometry.type === "Polygon") {
            turfPolygon = turf.polygon(polygon.geometry.coordinates);
          } else if (polygon.geometry.type === "MultiPolygon") {
            turfPolygon = turf.multiPolygon(polygon.geometry.coordinates);
          } else {
            console.error("Unsupported geometry type:", polygon.geometry.type);
            return false;
          }

          // Check if the point is inside the polygon
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
        // Clear the legend container
        legendRef.current.innerHTML = `<h4 class="text-sm font-semibold text-gray-900 border-b p-2">Legend</h4>`;

        // Add more content here based on geoPoints
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
          <div class="w-3 h-3 rounded-full" style="background-color: ${point.points_color || mapConfig.defaultColor
            }"></div>
          <span class="text-sm">${point.layer_legend || "Unnamed"}</span>`;
          legendRef.current.appendChild(item);
        });
        // Update the legend position
        mapRef.current.getContainer().appendChild(legendRef.current);
      } else {
        // Create the legend container
        legendRef.current = document.createElement("div");
        legendRef.current.className =
          "absolute bottom-[10px] right-[10px] z-10 bg-white border shadow h-48 min-w-48 rounded-md";
        legendRef.current.innerHTML = `<h4 class="text-sm font-semibold text-gray-900 border-b p-2">Legend</h4>`;
        // Add more content here based on geoPoints
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
          <div class="w-3 h-3 rounded-full" style="background-color: ${point.points_color || mapConfig.defaultColor
            }"></div>
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

  return (
    <div className="flex-1 h-full relative overflow-hidden" id="map-container">
      <div
        className="lg:absolute w-full h-screen overflow-hidden"
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
