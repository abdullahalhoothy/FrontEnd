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
import StatisticsPopup from "./StatisticsPopup";
import axios from "axios";
import { StylesControl } from "./StylesControl";
import { generatePopupContent } from "./generatePopupContent";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

function Container() {
  const { polygons, setPolygons, setSelectedPolygon, selectedPolygon } =
    usePolygonsContext();
  const { geoPoints, setGeoPoints } = useCatalogContext();
  const { centralizeOnce, initialFlyToDone, setInitialFlyToDone } =
    useLayerContext();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const styleLoadedRef = useRef(false);
  const lastCoordinatesRef = useRef<[number, number] | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const [currentStyle, setCurrentStyle] = useState(
    "mapbox://styles/mapbox/streets-v12"
  );

  useEffect(function () {
    if (mapContainerRef.current && !mapRef.current) {
      if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
          (): void => {},
          true // Lazy load the plugin only when text is in arabic
        );
      }

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: mapConfig.center as [number, number],
        attributionControl: true,
        zoom: mapConfig.zoom,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      const stylesControl = new StylesControl(currentStyle, setCurrentStyle);
      mapRef.current.addControl(stylesControl, "top-left");

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "simple_select",
      });

      mapRef.current.addControl(draw);

      mapRef.current.on("draw.create", (e) => {
        console.log(e.features[0]);
        setPolygons((prev: any) => {
          return [...prev, e.features[0]];
        });
      });

      mapRef.current.on("draw.update", (e) => {
        console.log(e, "update");
        const updatedPolygonsId = e.features[0].id;
        setPolygons((prev: any) => {
          return prev.map((polygon: any) => {
            return polygon.id === updatedPolygonsId ? e.features[0] : polygon;
          });
        });

        setSelectedPolygon(null);
      });

      mapRef.current.on("draw.delete", (e) => {
        console.log(e, "delete");
        const deletedPolygonsId = e.features[0].id;
        setPolygons((prev: any) => {
          return prev.filter((polygon: any) => {
            return polygon.id !== deletedPolygonsId;
          });
        });
        if (selectedPolygon && selectedPolygon.id === deletedPolygonsId) {
          setSelectedPolygon(null);
        }
      });

      mapRef.current.on("draw.move", (e) => {
        console.log(e, "move");
        if (selectedPolygon && selectedPolygon.id === e.features[0].id) {
          setSelectedPolygon(e.features[0]);
        } else {
          setSelectedPolygon(null);
        }
      });

      mapRef.current.on("styledata", function () {
        styleLoadedRef.current = true;
      });
    }

    return function () {
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
                  mapRef.current.setPaintProperty(
                    layerId,
                    "circle-color",
                    featureCollection.points_color || mapConfig.defaultColor
                  );
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

              const handleMouseOver = async (
                e: mapboxgl.MapMouseEvent & mapboxgl.EventData
              ) => {
                if (!mapRef.current) return;

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
                  const url = `https://maps.googleapis.com/maps/api/streetview?return_error_code=true&size=600x300&location=${lat},${lng}&heading=151.78&pitch=-0.76&key=${
                    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  }`;
                  try {
                    const response = await axios.get(url);
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

                // Reset cursor style
                mapRef.current.getCanvas().style.cursor = "";

                // Use setTimeout to check if the mouse is over the popup before closing
                setTimeout(() => {
                  if (!isOverPopup && popup) {
                    popup.remove();
                    popup = null;
                  }
                }, 200);

                if (hoveredStateId !== null) {
                  mapRef.current.setFeatureState(
                    { source: sourceId, id: hoveredStateId },
                    { hover: false }
                  );
                }

                hoveredStateId = null;
              };

              if (mapRef.current) {
                mapRef.current.on("mouseover", layerId, handleMouseOver);
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
      }
    };
  }, [geoPoints, initialFlyToDone, centralizeOnce]);

  useEffect(() => {
    const handleMapClick = (e) => {
      const coordinates = e.lngLat;
      const { lng, lat } = coordinates;

      console.log("Clicked coordinates:", lng, lat);

      const point = [lng, lat];

      const polygon = polygons.find((polygon) => {
        // Make sure the polygon coordinates are in the correct format
        const turfPolygon = turf.polygon(polygon.geometry.coordinates);
        console.log("Polygon coordinates:", polygon.geometry.coordinates);
        const isInside = turf.booleanPointInPolygon(point, turfPolygon);
        console.log("Point inside polygon:", isInside);
        return isInside;
      });

      if (polygon) {
        setSelectedPolygon(polygon);
      } else {
        setSelectedPolygon(null);
      }
    };

    if (mapRef.current) {
      mapRef.current.on("click", (e) => {
        handleMapClick(e);
      });
    }
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick);
      }
    };
  }, [polygons]);

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
        console.log("Updating legend");

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
          <div class="w-3 h-3 rounded-full" style="background-color: ${
            point.points_color || mapConfig.defaultColor
          }"></div>
          <span class="text-sm">${point.layer_legend || "Unnamed"}</span>`;
          legendRef.current.appendChild(item);
        });
        // Update the legend position
        mapRef.current.getContainer().appendChild(legendRef.current);
      } else {
        console.log("Creating legend");
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
          <div class="w-3 h-3 rounded-full" style="background-color: ${
            point.points_color || mapConfig.defaultColor
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
    <div className="w-[80%] h-full relative overflow-hidden ">
      <div
        className="absolute w-full h-full"
        id="map-container"
        ref={mapContainerRef}
      />
      <StatisticsPopup />
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
