import { createContext, useContext, useMemo, useState } from "react";
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
  selectedPolygon: PolygonFeature | null;
  setSelectedPolygon: React.Dispatch<
    React.SetStateAction<PolygonFeature | null>
  >;
  sections: {
    title: string;
    points: {
      prdcer_layer_name: string;
      count: number;
      percentage: number;
      avg: number;
    }[];
  }[];
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

  const [selectedPolygon, setSelectedPolygon] = useState<PolygonFeature | null>(
    null
  );

  const filteredGeoPointsOld = useMemo<GeoPoint[]>(() => {
    if (!selectedPolygon || geoPoints.length === 0) return [];

    const polygonCoordinates = turf.polygon(
      selectedPolygon.geometry.coordinates
    );

    return geoPoints.reduce<GeoPoint[]>((pointsInside, geoPoint) => {
      const totalFeatures: number = geoPoint.features.length;
      const matchingFeatures = geoPoint.features.filter((feature) => {
        const featurePoint = turf.point(feature.geometry.coordinates);
        return turf.booleanPointInPolygon(featurePoint, polygonCoordinates);
      });

      if (matchingFeatures.length > 0) {
        const totalRating = matchingFeatures.reduce((sum, feature) => {
          return sum + Number(feature.properties.rating || 0);
        }, 0);

        const avgRating = totalRating / matchingFeatures.length;

        const totalUserRatings = matchingFeatures.reduce((total, feature) => {
          return total + Number(feature.properties.user_ratings_total || 0);
        }, 0);

        // Calculate the percentage of features inside the polygon
        const percentageInside =
          (matchingFeatures.length / totalFeatures) * 100;

        pointsInside.push({
          ...geoPoint,
          features: matchingFeatures,
          avgRating: avgRating.toFixed(1) || 0,
          totalUserRatings: totalUserRatings,
          percentageInside: percentageInside,
        });
      }

      return pointsInside;
    }, []);
  }, [selectedPolygon, geoPoints]);

  const sections = useMemo<GeoPoint[]>(() => {
    if (!selectedPolygon || geoPoints.length === 0) return [];

    const excludedProperties: string[] =
      excludedPropertiesJson.excludedProperties;
    const polygonCoordinates = turf.polygon(
      selectedPolygon.geometry.coordinates
    );

    // Initialize sections array to store different sections
    const data: {
      title: string;
      points: {
        prdcer_layer_name: string;
        count: number;
        percentage: number;
        avg: number;
      }[];
    }[] = [];

    geoPoints.reduce<GeoPoint[]>((pointsInside, geoPoint) => {
      const totalFeatures: number = geoPoint.features.length;

      // Filter features inside the polygon
      const matchingFeatures = geoPoint.features.filter((feature) => {
        const featurePoint = turf.point(feature.geometry.coordinates);
        return turf.booleanPointInPolygon(featurePoint, polygonCoordinates);
      });

      if (matchingFeatures.length > 0) {
        // Initialize objects to accumulate values for each numeric property
        const propertySums: { [key: string]: number } = {};
        const propertyCounts: { [key: string]: number } = {};

        // Iterate over matching features to accumulate numeric values
        matchingFeatures.forEach((feature) => {
          for (const [key, val] of Object.entries(feature.properties)) {
            if (excludedProperties.includes(key)) continue;
            const numVal = Number(val);
            // Check if the value is not an empty string and is a valid number
            if (val !== "" && !isNaN(numVal)) {
              if (!propertySums[key]) {
                propertySums[key] = 0;
                propertyCounts[key] = 0;
              }

              propertySums[key] += numVal;
              propertyCounts[key] += 1;
            }
          }
        });

        // Update or create sections for each numeric property
        for (const [key, sum] of Object.entries(propertySums)) {
          const avg = sum / propertyCounts[key];
          const count = propertyCounts[key];
          const percentage = (count / totalFeatures) * 100;

          // Check if the section already exists
          let section = data.find((s) => s.title === key);

          if (!section) {
            // If the section doesn't exist, create a new one
            section = {
              title: key,
              points: [],
            };
            data.push(section);
          }

          // Add section for this geoPoint to the section
          section.points.push({
            prdcer_layer_name: geoPoint.prdcer_layer_name || "Unknown", // Layer name from geoPoint
            count: count, // Number of matching features
            percentage: percentage, // Percentage of features for this property
            avg: avg.toFixed(1),
          });
        }
      }

      return pointsInside;
    }, []);

    return data; // Return section if you need them elsewhere
  }, [selectedPolygon, geoPoints]);

  return (
    <PolygonsContext.Provider
      value={{
        polygons,
        setPolygons,
        selectedPolygon,
        setSelectedPolygon,
        sections,
      }}
    >
      {children}
    </PolygonsContext.Provider>
  );
};

export default PolygonsProvider;
