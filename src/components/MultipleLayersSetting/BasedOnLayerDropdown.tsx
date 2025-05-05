import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const filterableProperties = [
    'id',
    'phone',
    'address',
    'priceLevel',
    'primaryType',
    'rating',
    'heatmap_weight',
    'user_ratings_total',
    'popularity_score_category',
    'popularity_score',
  ];
  const availableTypes = [
    ...new Set(
      geoPoints.flatMap(layer => layer.features.flatMap(feature => feature.properties.types))
    ),
  ];

  const [isOpen, setIsOpen] = useState(false);

  const pickerRef = useRef<HTMLDivElement>(null);


  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (onColorChange) {
      onColorChange(color);
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

  const handleInputThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = e.target.value;
    setThreshold(newThreshold);

    if (setPropertyThreshold) {
      setPropertyThreshold(newThreshold);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() !== '') {
        setNameInputs([...nameInputs, inputValue.trim()]);
        setInputValue('');
      }
    }
  };

  const handleRemoveName = (index: number) => {
    setNameInputs(nameInputs.filter((_, i) => i !== index));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current) {

        return;
      }


      if (!pickerRef.current.contains(event.target)) {
        console.log('Closing picker...');
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              >
                {formatSubcategoryName(metric)}
              </option>
            );
          })}
        </select>

        {basedOnProperty === 'name' && (

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

            <div className="mt-3 relative " ref={pickerRef}>
              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm flex flex-col">
                Pick a Color
              </label>
              <div>
                <button
                  className="w-full h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => setIsOpen(!isOpen)}
                />
              </div>
              {isOpen && (

                <div className="absolute mt-2 bg-white p-2 border border-gray-300 shadow-md rounded-md z-50">

                  <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                </div>
              )}
            </div>
          </>
        )}

        {basedOnProperty && filterableProperties.includes(basedOnProperty) && (
          //&& selectedOption === 'filter'
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
                  <input
                    type="text"
                    value={threshold}
                    onChange={handleInputThresholdChange}
                    className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
                    placeholder={`Enter ${basedOnProperty
                      .replace(/_/g, ' ')

                      .replace(/\b\w/g, (char: any) =>
                        char.toUpperCase()
                      )}${basedOnProperty === 'rating' ? ' up to 5' : ''}`}
                  />
                )}
              </div>
            </div>
            {basedOnProperty && basedOnProperty !== 'name' && selectedOption !== 'recolor'  && (

            <div className="mt-3 relative " ref={pickerRef}>

              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm flex flex-col">
                Pick a Color
              </label>
              <div>
                <button
                  className="w-full h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => setIsOpen(!isOpen)}
                />
              </div>
              {isOpen && (

                <div className="absolute mt-2 bg-white p-2 border border-gray-300 shadow-md rounded-md z-50">

                  <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                </div>
              )}
            </div>

            )}
          </>
        )}

      </div>
    </>
  );
}
