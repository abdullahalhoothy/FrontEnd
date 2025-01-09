import React from "react";
import { useCatalogContext } from "../../context/CatalogContext";
import { BasedOnLayerDropdownProps } from "../../types/allTypesAndInterfaces";

export default function BasedOnLayerDropdown({ layerIndex }: BasedOnLayerDropdownProps) {
  const { basedOnLayerId, setBasedOnLayerId, geoPoints } = useCatalogContext();

  const availableLayers = geoPoints
    .map(layer => ({
      id: layer.prdcer_lyr_id,
      name: layer.prdcer_layer_name || `Layer ${layer.layerId}`
    }));

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    setBasedOnLayerId(event.target.value);
  };

  return (
    <div className="ms-2.5 flex flex-col">
      <label htmlFor="basedOnLayerDropdown" className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm">
        Compare with Layer
      </label>
      <select
        id="basedOnLayerDropdown"
        value={basedOnLayerId || ""}
        onChange={handleSelectChange}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out"
      >
        <option value="" disabled>Select a layer</option>
        {availableLayers.map(layer => {
          const isSelf = layer.id === geoPoints[layerIndex]?.prdcer_lyr_id;
          return (
            <option key={layer.id} value={layer.id}>
              {(layer.name.length > 20 ? `${layer.name.substring(0, 12)}...${layer.name.substring(layer.name.length - 12)}` : layer.name).concat(isSelf ? ' (Self)' : '')}
            </option>
          )
        })}
      </select>
    </div>
  );
}