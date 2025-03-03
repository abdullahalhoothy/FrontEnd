// import React, { useMemo } from 'react';
// import { useCatalogContext } from '../../context/CatalogContext';
// import { BasedOnLayerDropdownProps } from '../../types/allTypesAndInterfaces';
// import { formatSubcategoryName } from '../../utils/helperFunctions';

// export default function BasedOnLayerDropdown({ layerIndex }: BasedOnLayerDropdownProps) {
//   const { basedOnLayerId, setBasedOnLayerId, geoPoints, basedOnProperty, setBasedOnProperty } =
//     useCatalogContext();

//   const availableLayers = geoPoints.map(layer => ({
//     id: layer.prdcer_lyr_id,
//     name: layer.prdcer_layer_name || `Layer ${layer.layerId}`,
//   }));

//   const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     event.stopPropagation();
//     setBasedOnLayerId(event.target.value);
//   };

//   const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     event.stopPropagation();
//     setBasedOnProperty(event.target.value);
//   };

//   const metrics = useMemo(() => {
//     const filteredMetrics = geoPoints
//       .filter(layer => layer.prdcer_lyr_id === basedOnLayerId)
//       .map(layer => layer.properties)
//       .flat()
//       .filter(metric => metric !== null);

//     return Array.from(new Set(filteredMetrics));
//   }, [geoPoints, basedOnLayerId]);
//   return (
//     <>
//       <div className="ms-2.5 flex flex-col">
//         <label
//           htmlFor="basedOnLayerDropdown"
//           className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm"
//         >
//           Compare with Layer
//         </label>
//         <select
//           id="basedOnLayerDropdown"
//           value={basedOnLayerId || ''}
//           onChange={handleSelectChange}
//           className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out"
//         >
//           <option value="" disabled>
//             Select a layer
//           </option>
//           {availableLayers.map(layer => {
//             const isSelf = layer.id === geoPoints[layerIndex]?.prdcer_lyr_id;
//             return (
//               <option key={layer.id} value={layer.id}>
//                 {(layer.name.length > 20
//                   ? `${layer.name.substring(0, 12)}...${layer.name.substring(layer.name.length - 12)}`
//                   : layer.name
//                 ).concat(isSelf ? ' (Self)' : '')}
//               </option>
//             );
//           })}
//         </select>
//       </div>
//       <div className="ms-2.5 flex flex-col">
//         <label
//           htmlFor="basedOnPropertyDropdown"
//           className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm"
//         >
//           Based on
//         </label>
//         <select
//           id="basedOnPropertyDropdown"
//           value={basedOnProperty || ''}
//           disabled={!basedOnLayerId}
//           onChange={handleMetricChange}
//           className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out disabled:bg-gray-200 disabled:text-gray-500"
//         >
//           <option value="" disabled>
//             Select a metric
//           </option>
//           {metrics.map(metric => {
//             return (
//               <option key={metric} value={metric}>
//                 {formatSubcategoryName(metric)}
//               </option>
//             );
//           })}
//         </select>
//       </div>
//     </>
//   );
// }

import React, { useMemo, useState } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { BasedOnLayerDropdownProps } from '../../types/allTypesAndInterfaces';
import { formatSubcategoryName } from '../../utils/helperFunctions';
import { HexColorPicker } from 'react-colorful';

export default function BasedOnLayerDropdown({
  layerIndex,
  nameInputs,
  setNameInputs,
  selectedOption,
  onColorChange,
  setPropertyThreshold,
}: BasedOnLayerDropdownProps & {
  nameInputs: string[];
  setNameInputs: (names: string[]) => void;
  setPropertyThreshold?: any;
  selectedOption?: string;
  onColorChange?: (color: string) => void;
}) {
  const { basedOnLayerId, setBasedOnLayerId, geoPoints, basedOnProperty, setBasedOnProperty } =
    useCatalogContext();
  const availableLayers = geoPoints.map(layer => ({
    id: layer.prdcer_lyr_id,
    name: layer.prdcer_layer_name || `Layer ${layer.layerId}`,
  }));
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const availableTypes = [
    ...new Set(
      geoPoints.flatMap(layer => layer.features.flatMap(feature => feature.properties.types))
    ),
  ];

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (onColorChange) {
      onColorChange(color); // Call only if it's defined
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    setBasedOnLayerId(event.target.value);
  };

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    setBasedOnProperty(event.target.value);
    setNameInputs(['']);
  };

  const metrics = useMemo(() => {
    const filteredMetrics = geoPoints
      .filter(layer => layer.prdcer_lyr_id === basedOnLayerId)
      .map(layer => layer.properties)
      .flat()
      .filter(metric => metric !== null);

    return Array.from(new Set(filteredMetrics));
  }, [geoPoints, basedOnLayerId]);

  const handleNameChange = (index: number, value: string) => {
    const updatedNames = [...nameInputs];
    updatedNames[index] = value;
    setNameInputs(updatedNames);
  };

  const handleAddNameField = () => {
    setNameInputs([...nameInputs, '']);
  };

  const handleRemoveNameField = (index: number) => {
    setNameInputs(nameInputs.filter((_, i) => i !== index));
  };

  const [inputValue, setInputValue] = useState('');
  const [threshold, setThreshold] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  // const handleInputThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setThreshold(e.target.value);
  // };

  const handleInputThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = e.target.value;
    setThreshold(newThreshold);

    if (setPropertyThreshold) {
      setPropertyThreshold(newThreshold); // ✅ Pass threshold to parent
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault(); // Prevents adding commas in the input field
      if (inputValue.trim() !== '') {
        setNameInputs([...nameInputs, inputValue.trim()]); // Save as tag
        setInputValue(''); // Clear input field
      }
    }
  };

  const handleRemoveName = (index: number) => {
    setNameInputs(nameInputs.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="ms-2.5 flex flex-col">
        <label
          htmlFor="basedOnLayerDropdown"
          className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm"
        >
          Compare with Layer
        </label>
        <select
          id="basedOnLayerDropdown"
          value={basedOnLayerId || ''}
          onChange={handleSelectChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out"
        >
          <option value="" disabled>
            Select a layer
          </option>
          {availableLayers.map(layer => {
            const isSelf = layer.id === geoPoints[layerIndex]?.prdcer_lyr_id;
            return (
              <option key={layer.id} value={layer.id}>
                {(layer.name.length > 20
                  ? `${layer.name.substring(0, 12)}...${layer.name.substring(layer.name.length - 12)}`
                  : layer.name
                ).concat(isSelf ? ' (Self)' : '')}
              </option>
            );
          })}
        </select>
      </div>
      <div className="ms-2.5 flex flex-col">
        <label
          htmlFor="basedOnPropertyDropdown"
          className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm"
        >
          Based on
        </label>
        <select
          id="basedOnPropertyDropdown"
          value={basedOnProperty || ''}
          disabled={!basedOnLayerId}
          onChange={handleMetricChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out disabled:bg-gray-200 disabled:text-gray-500"
        >
          <option value="" disabled>
            Select a metric
          </option>
          {metrics.map(metric => {
            return (
              // <option key={metric} value={metric}>

              <option
                key={metric}
                value={metric}
                disabled={selectedOption === 'recolor' && metric.toLowerCase() === 'name'} // Disable "name" when recolor is selected
              >
                {formatSubcategoryName(metric)}
              </option>
            );
          })}
        </select>

        {basedOnProperty === 'name' && selectedOption === 'filter' && (
          <>
            <div className="flex flex-col mt-2">
              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm">
                Enter Names
              </label>

              <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-gray-50">
                {nameInputs
                  .filter(name => name.trim() !== '')
                  .map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center text-black border-2 rounded-xl px-2 py-0 text-xs"
                    >
                      {name}
                      <button
                        onClick={() => handleRemoveName(index)}
                        className="ml-2 text-red-500 font-bold text-xs shadow-sm p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
                  placeholder="Type and press comma..."
                />
              </div>
            </div>

            <div className="mt-3 relative">
              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm">
                Pick a Color
              </label>
              <div>
                <button
                  className="w-[40%] h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
              </div>

              {showColorPicker && (
                <div className="absolute z-10 mt-2 bg-white p-2 border border-gray-300 shadow-md rounded-md">
                  <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                </div>
              )}
            </div>
          </>
        )}

        {(basedOnProperty === 'id' ||
          basedOnProperty === 'phone' ||
          basedOnProperty === 'address' ||
          basedOnProperty === 'priceLevel' ||
          basedOnProperty === 'primaryType' ||
          basedOnProperty === 'rating' ||
          basedOnProperty === 'heatmap_weight' ||
          basedOnProperty === 'user_ratings_total' ||
          basedOnProperty === 'popularity_score_category' ||
          basedOnProperty === 'popularity_score') &&
          selectedOption === 'filter' && (
            <>
              <div className="flex flex-col mt-2">
                <label className="text-[11px] text-[#555] whitespace-nowrap text-sm">
                  {`Enter ${basedOnProperty
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char: any) => char.toUpperCase())}`}
                </label>

                <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-gray-50">
                  {nameInputs
                    .filter(name => name.trim() !== '')
                    .map((name, index) => (
                      <div
                        key={index}
                        className="flex items-center text-black border-2 rounded-xl px-2 py-0 text-xs"
                      >
                        {name}
                        <button
                          onClick={() => handleRemoveName(index)}
                          className="ml-2 text-red-500 font-bold text-xs shadow-sm p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                  {basedOnProperty === 'popularity_score_category' ? (
                    <select
                      value={threshold}
                      onChange={handleInputThresholdChange}
                      className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none p-1 rounded-md"
                    >
                      <option value="">Select Category</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                      <option value="Low">Low</option>
                      <option value="Very Low">Very Low</option>
                    </select>
                  ) : basedOnProperty === 'primaryType' ? (
                    // Select dropdown for primaryType from availableTypes
                    <select
                      value={threshold}
                      onChange={handleInputThresholdChange}
                      className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none p-1 rounded-md"
                    >
                      <option value="">Select Primary Type</option>
                      {availableTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (char: any) => char.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Regular text input for other properties
                    <input
                      type="text"
                      value={threshold}
                      onChange={handleInputThresholdChange}
                      className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
                      placeholder={`Enter ${basedOnProperty
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (char: any) => char.toUpperCase())}`}
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 relative">
                <label className="text-[11px] text-[#555] whitespace-nowrap text-sm">
                  Pick a Color
                </label>
                <div>
                  <button
                    className="w-[40%] h-10 rounded-md border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                </div>

                {showColorPicker && (
                  <div className="absolute z-10 mt-2 bg-white p-2 border border-gray-300 shadow-md rounded-md">
                    <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </>
  );
}
