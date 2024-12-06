import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCatalogContext } from "./CatalogContext";
import * as turf from "@turf/turf";
import { Feature } from "../types/allTypesAndInterfaces";
import excludedPropertiesJson from "../pages/MapContainer/excludedProperties.json";

type ProviderProps = {
  children: React.ReactNode;
};

type GeoPoint = {
  features: Feature[];
  avgRating?: number;
  totalUserRatings?: number;
  prdcer_layer_name?: string;
  points_color?: string;
  layer_legend?: string;
  layer_description?: string;
  is_zone_lyr?: string;
  city_name?: string;
  percentageInside?: number;
};

type PolygonFeature = {
  geometry: {
    coordinates: [number, number][][];
  };
};

type PolygonContextType = {
  polygons: PolygonFeature[];
  setPolygons: React.Dispatch<React.SetStateAction<PolygonFeature[]>>;
  sections: {
    title: string;
    points: {
      prdcer_layer_name: string;
      count: number;
      percentage: number;
      avg: number;
    }[];
  }[];
  benchmarks: Benchmark[];
  setBenchmarks: React.Dispatch<React.SetStateAction<Benchmark[]>>;
  isBenchmarkControlOpen: boolean;
  setIsBenchmarkControlOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type Benchmark = {
  title: string;
  value: number | "";
};

// Create the PolygonsContext with default value as empty object cast to PolygonContextType
const PolygonsContext = createContext<PolygonContextType>(
  {} as PolygonContextType
);

export const usePolygonsContext = (): PolygonContextType => {
  const context = useContext(PolygonsContext);
  if (!context) {
    throw new Error(
      "usePolygonsContext must be used within a PolygonsProvider"
    );
  }
  return context;
};

const PolygonsProvider = ({ children }: ProviderProps) => {
  const { geoPoints } = useCatalogContext(); // Assuming geoPoints comes from CatalogContext
  const [polygons, setPolygons] = useState<PolygonFeature[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [isBenchmarkControlOpen, setIsBenchmarkControlOpen] = useState(false);

  const sections = useMemo(() => {
    if (!Array.isArray(polygons) || !Array.isArray(geoPoints)) {
      return [];
    }

    const excludedProperties = new Set(
      excludedPropertiesJson?.excludedProperties || []
    );

    const getPolygonShape = (coordinates, type) => {
      if (type === "MultiPolygon") {
        return coordinates.map((circle) => {
          const ring = circle[0];
          if (
            ring.length < 4 ||
            !turf.booleanEqual(
              turf.point(ring[0]),
              turf.point(ring[ring.length - 1])
            )
          ) {
            ring.push(ring[0]); // Ensure closed ring
          }
          return turf.polygon(circle);
        });
      } else if (type === "Polygon") {
        const ring = coordinates[0];
        if (
          ring.length < 4 ||
          !turf.booleanEqual(
            turf.point(ring[0]),
            turf.point(ring[ring.length - 1])
          )
        ) {
          ring.push(ring[0]); // Ensure closed ring
        }
        return [turf.polygon([ring])];
      }
      return [];
    };

    return polygons.map((polygon) => {
      if (!polygon.geometry?.coordinates) {
        return { polygon, sections: [], areas: [] };
      }

      const polygonData = {
        polygon,
        sections: [],
        areas:
          polygon.properties.shape === "circle"
            ? ["1KM", "3KM", "5KM"]
            : ["Unknown"],
      };

      const polygonShapes = getPolygonShape(
        polygon.geometry.coordinates,
        polygon.geometry.type
      );
      const sectionsMap = new Map();
      const previouslyMatchedPoints = new Set();

      geoPoints.forEach((geoPoint) => {
        const totalFeatures = geoPoint.features?.length || 0;

        polygonShapes.forEach((polygonShape, index) => {
          const areaName = polygonData.areas[index];
          const matchingFeatures =
            geoPoint.features?.filter((feature) => {
              const featureCoords = JSON.stringify(
                feature.geometry.coordinates
              );
              if (previouslyMatchedPoints.has(featureCoords)) return false;
              if (
                turf.booleanPointInPolygon(
                  turf.point(feature.geometry.coordinates),
                  polygonShape
                )
              ) {
                previouslyMatchedPoints.add(featureCoords);
                return true;
              }
              return false;
            }) || [];

          matchingFeatures.forEach((feature) => {
            Object.entries(feature.properties).forEach(([key, val]) => {
              if (!excludedProperties.has(key)) {
                const numVal = Number(val);
                if (val !== "" && !isNaN(numVal)) {
                  if (!sectionsMap.has(key)) {
                    sectionsMap.set(key, new Map());
                  }
                  const layerMap = sectionsMap.get(key);
                  if (!layerMap.has(geoPoint.prdcer_layer_name)) {
                    layerMap.set(geoPoint.prdcer_layer_name, new Map());
                  }
                  const areaMap = layerMap.get(geoPoint.prdcer_layer_name);
                  if (!areaMap.has(areaName)) {
                    areaMap.set(areaName, { sum: 0, count: 0 });
                  }
                  const areaData = areaMap.get(areaName);
                  areaData.sum += numVal;
                  areaData.count += 1;
                }
              }
            });
          });
        });
      });

      polygonData.sections = Array.from(sectionsMap, ([title, layerMap]) => ({
        title,
        points: Array.from(layerMap, ([layer_name, areaMap]) => ({
          layer_name,
          data: polygonData.areas.map((area) => {
            const areaData = areaMap.get(area) || { sum: 0, count: 0 };
            const count = areaData.count;
            const avg = count ? areaData.sum / count : 0;
            return {
              count,
              percentage: parseFloat(
                (
                  (count /
                    (geoPoints.find((gp) => gp.prdcer_layer_name === layer_name)
                      ?.features?.length || 1)) *
                  100
                ).toFixed(1)
              ),
              avg: count ? parseFloat(avg.toFixed(1)) : "-",
              area,
            };
          }),
        })),
      }));

      return polygonData;
    });
  }, [polygons, geoPoints, excludedPropertiesJson?.excludedProperties]);

  useEffect(() => {
    const newBenchmarks: Benchmark[] = [...benchmarks];
    sections.forEach((polygon) => {
      polygon.sections.forEach((section) => {
        const isSectionExists = newBenchmarks.some(
          (benchmark) => benchmark.title === section.title
        );
        if (!isSectionExists) {
          newBenchmarks.push({ title: section.title, value: "" });
        }
      });
    });
    setBenchmarks(newBenchmarks);
  }, [sections]);

  return (
    <PolygonsContext.Provider
      value={{
        polygons,
        setPolygons,
        sections,
        benchmarks,
        setBenchmarks,
        isBenchmarkControlOpen,
        setIsBenchmarkControlOpen,
      }}
    >
      {children}
    </PolygonsContext.Provider>
  );
};

export default PolygonsProvider;
