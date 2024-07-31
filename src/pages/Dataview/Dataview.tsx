import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the grid
import { FaImages } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { useCatalogContext } from "../../context/CatalogContext";
import { TabularData, Feature } from '../../types/allTypesAndInterfaces';
import { useGetData } from '../../context/AppDataContext';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ColDef } from "ag-grid-community";



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

  useEffect(() => {
    if (geoPoints && typeof geoPoints !== "string"){
      const tabularData = geoPoints.features.map(mapFeatureToTabularData);
      setBusinesses(tabularData);
    } else {
      // Use a default value when x is undefined or doesn't have features
      setBusinesses([]);
    }
  }, [geoPoints]);

  return (
    <div
      className="ag-theme-quartz-dark"
      style={{ height: "100%", width: "100%", backgroundColor: "#182230" }}
    >
      <AgGridReact
        columnDefs={columnDefs}
        rowData={businesses}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 25, 50]}
      />
    </div>
  );
};

export default Dataview;
