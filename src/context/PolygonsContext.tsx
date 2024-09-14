import { createContext, useContext, useMemo, useState } from "react";
import { useCatalogContext } from "./CatalogContext";
import * as turf from "@turf/turf";
import { Feature } from "../types/allTypesAndInterfaces";

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
  filteredGeoPoints: GeoPoint[];
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

  const filteredGeoPoints = useMemo<GeoPoint[]>(() => {
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
        // Calculate the average rating
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

  return (
    <PolygonsContext.Provider
      value={{
        polygons,
        setPolygons,
        selectedPolygon,
        setSelectedPolygon,
        filteredGeoPoints,
      }}
    >
      {children}
    </PolygonsContext.Provider>
  );
};

export default PolygonsProvider;
