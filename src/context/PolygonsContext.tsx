import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PolygonFeature } from "../types/allTypesAndInterfaces";
import { useCatalogContext } from "./CatalogContext";
import * as turf from "@turf/turf";

interface PolygonContextType {
  polygons: PolygonFeature[];
  setPolygons: React.Dispatch<React.SetStateAction<PolygonFeature[]>>;
  selectedPolygon: PolygonFeature | null;
  setSelectedPolygon: React.Dispatch<
    React.SetStateAction<PolygonFeature | null>
  >;
  pointsInsidePolygon: any;
}

type ProviderProps = {
  children: React.ReactNode;
};

const PolygonsContext = createContext<PolygonContextType>(
  {} as PolygonContextType
);
export const usePolygonsContext = () => {
  const context = useContext(PolygonsContext);
  if (!context) {
    throw new Error(
      "usePolygonsContext must be used within a PolygonsProvider"
    );
  }
  return context;
};

const PolygonsProvider = ({ children }: ProviderProps) => {
  const { geoPoints } = useCatalogContext();
  const [polygons, setPolygons] = useState([]);

  const [selectedPolygon, setSelectedPolygon] = useState<PolygonFeature | null>(
    null
  );

  const pointsInsidePolygon = useMemo(() => {
    if (!selectedPolygon || geoPoints.length === 0) return;
    const points = geoPoints.map((point) => {
      return point.features.filter((feature) => {
        const pt = turf.point(feature.geometry.coordinates);
        const poly = turf.polygon(selectedPolygon.geometry.coordinates);
        return turf.booleanPointInPolygon(pt, poly);
      });
    });
    return points;
  }, [selectedPolygon, geoPoints]);

  return (
    <PolygonsContext.Provider
      value={{
        polygons,
        setPolygons,
        selectedPolygon,
        setSelectedPolygon,
        pointsInsidePolygon,
      }}
    >
      {children}
    </PolygonsContext.Provider>
  );
};

export default PolygonsProvider;
