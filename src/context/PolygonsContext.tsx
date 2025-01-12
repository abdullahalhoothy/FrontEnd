import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCatalogContext } from "./CatalogContext";
import * as turf from "@turf/turf";
import {PolygonFeature, Benchmark, Section, PolygonData, GeoPoint, PolygonContextType, ProviderProps } from "../types/allTypesAndInterfaces";
import excludedPropertiesJson from "../pages/MapContainer/excludedProperties.json";

const PolygonsContext = createContext<PolygonContextType>({} as PolygonContextType);

export const usePolygonsContext = (): PolygonContextType => {
  const context = useContext(PolygonsContext);
  if (!context) {
    throw new Error("usePolygonsContext must be used within a PolygonsProvider");
  }
  return context;
};

const PolygonsProvider = ({ children }: ProviderProps) => {
  const { geoPoints } = useCatalogContext();
  const [polygons, setPolygons] = useState<PolygonFeature[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [isBenchmarkControlOpen, setIsBenchmarkControlOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState(
    'mapbox://styles/mapbox/streets-v11'
  )

  const sections = useMemo(() => {
    if (!Array.isArray(polygons) || !Array.isArray(geoPoints)) {
      return [] as Section[];
    }


    const excludedProperties = new Set(excludedPropertiesJson?.excludedProperties || []);

    const getPolygonShape = (coordinates: any[], type: string) => {
      if (type === "MultiPolygon") {
        return coordinates.map((circle) => {
          const ring = circle[0];
          if (ring.length < 4 || !turf.booleanEqual(turf.point(ring[0]), turf.point(ring[ring.length - 1]))) {
            ring.push(ring[0]); // Ensure closed ring
          }
          return turf.polygon(circle);
        });
      } else if (type === "Polygon") {
        const ring = coordinates[0];
        if (ring.length < 4 || !turf.booleanEqual(turf.point(ring[0]), turf.point(ring[ring.length - 1]))) {
          ring.push(ring[0]); // Ensure closed ring
        }
        return [turf.polygon([ring])];
      }
      return [];
    };

    const processedPolygons: PolygonData[] = polygons.map((polygon) => {
      if (!polygon.geometry?.coordinates) {
        return { polygon, sections: [], areas: [] };
      }

      const polygonData: PolygonData = {
        polygon,
        sections: [],
        areas: polygon.properties.shape === "circle" ? ["1KM", "3KM", "5KM"] : ["Unknown"],
      };

      const polygonShapes = getPolygonShape(polygon.geometry.coordinates, polygon.geometry.type);
      const sectionsMap = new Map();
      const previouslyMatchedPoints = new Set();

      geoPoints.forEach((geoPoint: GeoPoint) => {
        const totalFeatures = geoPoint.features?.length || 0;

        polygonShapes.forEach((polygonShape, index) => {
          const areaName = polygonData.areas[index];
          const matchingFeatures = geoPoint.features?.filter((feature) => {
            const featureCoords = JSON.stringify(feature.geometry.coordinates);
            if (previouslyMatchedPoints.has(featureCoords)) return false;
            if (turf.booleanPointInPolygon(turf.point(feature.geometry.coordinates), polygonShape)) {
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
            return {
              count: areaData.count,
              percentage: parseFloat(
                ((areaData.count / (geoPoints.find((gp: GeoPoint) => gp.prdcer_layer_name === layer_name)?.features?.length || 1)) * 100).toFixed(1)
              ),
              avg: areaData.count ? parseFloat(areaData.sum / areaData.count) : "-",
              area,
            };
          }),
        })),
      }));

      return polygonData;
    });

    return processedPolygons;
  }, [polygons, geoPoints]); 

  useEffect(() => {
    const newBenchmarks: Benchmark[] = [];
    
    // Get unique properties from all layers
    const properties = new Set<string>();
    geoPoints.forEach(layer => {
      layer.features?.forEach(feature => {
        Object.entries(feature.properties).forEach(([key, val]) => {
          // Only add numeric properties
          if (typeof val === 'number' || !isNaN(Number(val))) {
            properties.add(key);
          }
        });
      });
    });


    // Create benchmarks for each numeric property
    properties.forEach(property => {
      if (!benchmarks.some(b => b.title === property)) {
        newBenchmarks.push({
          title: property,
          value: "",
        });
      }
    });

    if (newBenchmarks.length > 0) {
      setBenchmarks(prev => [...prev, ...newBenchmarks]);
    }
  }, [geoPoints]);

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
        currentStyle,
        setCurrentStyle
      }}
    >
      {children}
    </PolygonsContext.Provider>
  );
};

export default PolygonsProvider;

export function calculatePolygonStats(polygon: any, geoPoints: any[]) {
  // Process points within polygon
  const pointsWithin = geoPoints.map(layer => {
    const matchingPoints = layer.features.filter(point => 
      turf.booleanPointInPolygon(point, polygon)
    );
    
    return {
      title: layer.layer_legend || layer.prdcer_layer_name,
      count: matchingPoints.length,
      percentage: ((matchingPoints.length / layer.features.length) * 100).toFixed(1)
    };
  });

  return pointsWithin;
}
