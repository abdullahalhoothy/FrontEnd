import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";
import mapConfig from "../../mapConfig.json";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import { CustomProperties } from "../../types/allTypesAndInterfaces";
import styles from "./MapContainer.module.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

function MapContainer() {
  const {
    geoPoints,
    isAdvancedMode,
    openDropdownIndices,
    colors,

    gradientColorBasedOnZone,
    layerColors,
    setLayerColors,
    isRadiusMode,
  } = useCatalogContext();
  const { centralizeOnce, initialFlyToDone, setInitialFlyToDone } =
    useLayerContext();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const styleLoadedRef = useRef(false);
  const lastCoordinatesRef = useRef<[number, number] | null>(null);

  console.log(layerColors);
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
        style: "mapbox://styles/mapbox/streets-v11",
        center: mapConfig.center as [number, number],
        attributionControl: true,
        zoom: mapConfig.zoom,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      mapRef.current.on("styledata", function () {
        styleLoadedRef.current = true;
      });
    }

    return function () {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  function getColorsArray(colorHex, index) {
    const array = colors?.find((arr) => arr.includes(colorHex));
    return array[index];
  }

  useEffect(
    function () {
      console.log("UseEffect MapContainer [GeoPoints]");

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
          console.log("0");
          geoPoints.forEach(function (featureCollection, index) {
            const sourceId = "circle-source-" + index;
            const layerId = "circle-layer-" + index;
            const existingSource = mapRef.current
              ? (mapRef.current.getSource(sourceId) as GeoJSONSource)
              : null;
            // Assuming that featureCollection has a property `isCurrent`
            const isCurrentLayer = featureCollection.isCurrent;
            console.log(isCurrentLayer);
            if (featureCollection.display) {
              if (existingSource) {
                existingSource.setData(featureCollection);
                // updateLayersBasedOnDistance(index, featureCollection);
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

                    if (isAdvancedMode?.length != 0) {
                      if (
                        isAdvancedMode[layerId] === true ||
                        (isRadiusMode
                          ? index == 0
                            ? isAdvancedMode["circle-layer-1"] == true
                            : isAdvancedMode["circle-layer-0"] === true
                          : null)
                      ) {
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
                          console.log(gradientColorBasedOnZone);
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

                if (mapRef.current) {
                  mapRef.current.on(
                    "mousemove",
                    layerId,
                    function (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) {
                      if (mapRef.current) {
                        mapRef.current.getCanvas().style.cursor = "pointer";
                      }
                      if (e.features && e.features.length > 0) {
                        if (hoveredStateId !== null && mapRef.current) {
                          mapRef.current.setFeatureState(
                            { source: sourceId, id: hoveredStateId },
                            { hover: false }
                          );
                        }
                        hoveredStateId = e.features[0].id as number;
                        if (mapRef.current) {
                          mapRef.current.setFeatureState(
                            { source: sourceId, id: hoveredStateId },
                            { hover: true }
                          );
                        }

                        const coordinates = (
                          e.features[0].geometry as any
                        ).coordinates.slice();
                        const properties = e.features[0]
                          .properties as CustomProperties;

                        const description = generatePopupContent(properties);

                        if (popup) {
                          popup.remove();
                        }
                        popup = new mapboxgl.Popup({
                          closeButton: false,
                          className: styles.popup,
                        })
                          .setLngLat(coordinates)
                          .setHTML(description)
                          .addTo(mapRef.current!);
                      }
                    }
                  );

                  mapRef.current.on("mouseleave", layerId, function () {
                    if (mapRef.current) {
                      mapRef.current.getCanvas().style.cursor = "";
                      if (hoveredStateId !== null) {
                        mapRef.current.setFeatureState(
                          { source: sourceId, id: hoveredStateId },
                          { hover: false }
                        );
                      }
                    }
                    hoveredStateId = null;
                    if (popup) {
                      popup.remove();
                      popup = null;
                    }
                  });
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

      return function () {
        if (mapRef.current) {
          mapRef.current.off("styledata", addGeoPoints);
        }
      };
    },
    [geoPoints, initialFlyToDone, centralizeOnce, gradientColorBasedOnZone]
  );

  return (
    <div className="w-[80%] h-full relative overflow-hidden ">
      <div
        className="absolute w-full h-full"
        id="map-container"
        ref={mapContainerRef}
      />
    </div>
  );
}

function generatePopupContent(properties: CustomProperties): string {
  let content = `<div class="${styles.popupContent}">`;

  // Always included fields at the top
  content += `<strong class="${styles.popupContentStrong}">${properties.name}</strong>`;

  // Dynamically included fields in the middle
  for (const key in properties) {
    const value = properties[key];
    if (
      key !== "name" &&
      key !== "user_ratings_total" &&
      key !== "rating" &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      let parsedValue = value;
      if (
        typeof value === "string" &&
        value.startsWith("[") &&
        value.endsWith("]")
      ) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          console.error(`Failed to parse value for key: ${key}`, e);
        }
      }

      if (Array.isArray(parsedValue)) {
        content += `<div class="${
          styles.popupContentDiv
        }">${key}: ${parsedValue.join(", ")}</div>`;
      } else {
        content += `<div class="${styles.popupContentDiv}">${key}: ${parsedValue}</div>`;
      }
    }
  }

  // Always included fields at the end
  content += `<div class="${styles.popupContentDiv} ${styles.popupContentTotalRatings}">Total Ratings: ${properties.user_ratings_total}</div>`;
  content += `<div class="${styles.popupContentDiv} ${styles.popupContentRating}">Rating: ${properties.rating}</div>`;

  content += `</div>`;

  return content;
}

export default MapContainer;
