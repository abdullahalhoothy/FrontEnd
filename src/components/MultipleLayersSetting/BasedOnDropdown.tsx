import React from "react";
import { useCatalogContext } from "../../context/CatalogContext";

interface BasedOnDropdownProps {
  layerIndex: number;
}

export default function BasedOnDropdown({ layerIndex }: BasedOnDropdownProps) {
  const { openDropdownIndices, geoPoints, setGeoPoints, setSelectedBasedon } = useCatalogContext();

  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndices[3] === dropdownIndex;

  const currentBasedon = geoPoints[layerIndex]?.basedon ?? '';

  const layerNames = geoPoints[layerIndex]?.properties;

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedBasedon(value);
    
    setGeoPoints(prev =>
      prev.map((point, idx) =>
        idx === layerIndex ? { ...point, basedon: value } : point
      )
    );
  };

  return (
    <div className="ms-2.5 flex flex-col">
      <label
        htmlFor="ratingDropdown"
        className={`text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm`}
      >
        Based on
      </label>
      <select
        id="ratingDropdown"
        value={currentBasedon}
        onChange={handleMetricChange}
        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-grey-100 focus:border-grey-100 block w-full p-1"
      >
        <option value="" disabled>Select an option</option>
        {layerNames?.map((name: string, index: number) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}