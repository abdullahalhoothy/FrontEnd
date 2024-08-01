import React, { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";
import { useCatalogContext } from "../../context/CatalogContext";
import { useLayerContext } from "../../context/LayerContext";
import styles from "./MapContainer.module.css";
import { CustomProperties } from "../../types/allTypesAndInterfaces";
import mapConfig from "../../mapConfig.json";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY ?? "";

function MapContainer() {
  const { geoPoints } = useCatalogContext();
  const { centralizeOnce, initialFlyToDone, setInitialFlyToDone } =
    useLayerContext();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const styleLoadedRef = useRef(false);
  const lastCoordinatesRef = useRef<[number, number] | null>(null);

  useEffect(function () {
    if (mapContainerRef.current && !mapRef.current) {
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

  useEffect(
    function () {
      function addGeoPoints() {
        if (mapRef.current && styleLoadedRef.current) {
          const existingLayers = mapRef.current.getStyle().layers;
          const existingLayerIds = existingLayers
            ? existingLayers.map(function (layer) {
                return layer.id;
              })
            : [];

          existingLayerIds.forEach(function (layerId) {
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
                  mapRef.current.setPaintProperty(
                    layerId,
                    "circle-color",
                    featureCollection.points_color || mapConfig.defaultColor
                  );
                }
              } else {
                if (mapRef.current) {
                  mapRef.current.addSource(sourceId, {
                    type: "geojson",
                    data: featureCollection,
                    generateId: true,
                  });

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
    [geoPoints, initialFlyToDone, centralizeOnce]
  );

  return (
    <div
      id="map-container"
      ref={mapContainerRef}
      style={{ width: "96%", height: "100vh", zIndex: 99 }}
    />
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
