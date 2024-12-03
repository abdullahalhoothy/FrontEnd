import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the grid
import { TabularData, Feature } from "../../types/allTypesAndInterfaces";
import { ColDef } from "ag-grid-community";
import { useCatalogContext } from "../../context/CatalogContext";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

// Define the column definitions for the grid
export const columnDefs: ColDef<TabularData>[] = [
  { headerName: "Name", field: "name", sortable: true, filter: true },
  {
    headerName: "Address",
    field: "formatted_address",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Website",
    field: "website",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Rating",
    field: "rating",
    sortable: true,
  },
  {
    headerName: "Total Rating",
    field: "user_ratings_total",
    sortable: true,
  },
];

// Function to map a feature to tabular data
export function mapFeatureToTabularData(feature: Feature): TabularData {
  return {
    name: feature.properties.name,
    formatted_address: feature.properties.address,
    website: feature.properties.website,
    rating: Number(feature.properties.rating),
    user_ratings_total: Number(feature.properties.user_ratings_total),
  };
}

const Dataview: React.FC = () => {
  const [businesses, setBusinesses] = useState<TabularData[]>([]);
  const { geoPoints } = useCatalogContext();

  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    // if (!isAuthenticated) nav("/auth");
  }, []);

  useEffect(() => {
    if (geoPoints.length > 0) {
      // Use flatMap to combine features from all MapFeatures objects
      const tabularData = geoPoints.flatMap((mapFeature) =>
        mapFeature.features.map(mapFeatureToTabularData)
      );
      setBusinesses(tabularData);
    } else {
      setBusinesses([]);
    }
  }, [geoPoints]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div
        className="ag-theme-quartz-dark"
        style={{ height: "100%", width: "100%", backgroundColor: "#182230" }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={businesses}
          pagination={true}
          paginationPageSize={10}
          
        />
      </div>
    </div>
  );
};

export default Dataview;
