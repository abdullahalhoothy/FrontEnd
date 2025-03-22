import React, { useState, useEffect, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import styles from './MultipleLayersSetting.module.css';
import ColorSelect from '../ColorSelect/ColorSelect';
import { useCatalogContext } from '../../context/CatalogContext';
import {
  GradientColorBasedOnZone,
  MultipleLayersSettingProps,
  DisplayType,
} from '../../types/allTypesAndInterfaces';
import DropdownColorSelect from '../ColorSelect/DropdownColorSelect';
import { IoIosArrowDropdown } from 'react-icons/io';
import { RiCloseCircleLine } from 'react-icons/ri';
import urls from '../../urls.json';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../services/apiRequest';
import BasedOnLayerDropdown from './BasedOnLayerDropdown';
import { toast } from 'sonner';

const initialBasedon = 'radius';
const initialRadius = 1000;

function MultipleLayersSetting(props: MultipleLayersSettingProps) {
  const { layerIndex } = props;
  const {
    geoPoints,
    setGeoPoints,
    updateLayerDisplay,
    updateLayerHeatmap,
    removeLayer,
    restoreLayer,
    isAdvanced,
    setIsAdvanced,
    openDropdownIndices,
    setOpenDropdownIndices,
    updateDropdownIndex,
    setColors,
    setReqGradientColorBasedOnZone,
    colors,
    chosenPallet,
    setChosenPallet,
    selectedBasedon,
    setSelectedBasedon,
    layerColors,
    setLayerColors,
    setGradientColorBasedOnZone,
    setIsAdvancedMode,
    setIsRadiusMode,
    updateLayerGrid,
    updateLayerColor,
    resetState,
    basedOnLayerId,
    basedOnProperty,
    setBasedOnProperty,
    setIsLoading,
    isLoading,
    handleColorBasedZone,
    gradientColorBasedOnZone,
    handleFilteredZone,
    handleNameBasedColorZone,
  } = useCatalogContext();
  const layer = geoPoints[layerIndex];

  const { prdcer_layer_name, layer_legend, is_zone_lyr, display, is_heatmap, is_grid, city_name } =
    layer;
  const [isZoneLayer, setIsZoneLayer] = useState(is_zone_lyr);
  const [isDisplay, setIsDisplay] = useState(display);
  const [isHeatmap, setIsHeatmap] = useState(is_heatmap);
  const [isGrid, setIsGrid] = useState(is_grid);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { authResponse } = useAuth();
  const [selectedOption, setSelectedOption] = useState('recolor');
  const [isError, setIsError] = useState<Error | null>(null);
  const [radiusInput, setRadiusInput] = useState<number | string>(layer.radius_meters || 1000);
  const [nameInputs, setNameInputs] = useState<string[]>([]);

  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndices[1] === dropdownIndex;

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [deletedTimestamp, setDeletedTimestamp] = useState<number | null>(null);

  const [displayType, setDisplayType] = useState(
    layer.is_gradient
      ? DisplayType.REGULAR // Force REGULAR if gradient
      : isGrid
        ? DisplayType.GRID
        : isHeatmap
          ? DisplayType.HEATMAP
          : DisplayType.REGULAR
  );

  useEffect(function () {
    handleGetGradientColors();
    setSelectedBasedon(layer.basedon || initialBasedon);
    setRadiusInput(layer.radius_meters || initialRadius);
  }, []);
  useEffect(
    function () {
      setIsZoneLayer(layer.is_zone_lyr);
      setIsDisplay(layer.display);
      setIsHeatmap(layer.is_heatmap);
    },
    [layer.is_zone_lyr, layer.display, layer.is_heatmap]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsAdvanced(false);
        updateDropdownIndex(1, null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setOpenDropdownIndices]);

  function handleDisplayChange() {
    updateLayerDisplay(layerIndex, !isDisplay);
    setIsDisplay(!isDisplay);
  }

  function handleHeatMapChange() {
    if (isGrid) {
      setIsGrid(false);
    }
    updateLayerHeatmap(layerIndex, !isHeatmap);
    setIsHeatmap(!isHeatmap);
  }

  function handleRemoveLayer() {
    setIsAdvancedMode(prev => {
      const newMode = { ...prev };
      delete newMode[`circle-layer-${layerIndex}`];
      return newMode;
    });

    // Remove this layer from gradient colors
    setGradientColorBasedOnZone(prev => prev.filter(item => item.layerId !== layerIndex));

    // Remove this layer from geoPoints
    setGeoPoints(prev => prev.filter((_, index) => index !== layerIndex));

    // Remove this layer's color
    setLayerColors(prev => {
      const newColors = { ...prev };
      delete newColors[layerIndex];
      return newColors;
    });

    // Reset chosen pallet only if it was this layer
    if (chosenPallet === layerIndex) {
      setChosenPallet(null);
    }
  }

  function toggleDropdown(event: MouseEvent) {
    event.stopPropagation();

    if (isOpen) {
      updateDropdownIndex(1, null);
    } else {
      updateDropdownIndex(1, dropdownIndex);
    }
  }

  async function handleGetGradientColors() {

    try {
      const res = await apiRequest({
        url: urls.fetch_gradient_colors,
        method: 'get',
      });
      setColors(res.data.data);
    } catch (error) {
      setIsError(error instanceof Error ? error : new Error(String(error)));
      console.error('error fetching gradient colors', error);
    }
  }

  function handleApplyRadius(newRadius: number | string) {
    if (!newRadius) {
      return null;
    } else {
      setIsRadiusMode(true);
      const prdcer_lyr_id =
        layerIndex == 0
          ? geoPoints[0]?.prdcer_lyr_id
          : layerIndex == 1
            ? geoPoints[1]?.prdcer_lyr_id
            : '';
      const change_lyr_id =
        layerIndex == 0
          ? geoPoints[1]?.prdcer_lyr_id
          : layerIndex == 1
            ? geoPoints[0]?.prdcer_lyr_id
            : '';

      const updatedLayer = {
        ...geoPoints[layerIndex],
        radius_meters: newRadius || 1000,
      };
      setGeoPoints(prev => {
        const updated = [...prev];
        updated[layerIndex] = updatedLayer;
        return updated;
      });

      setReqGradientColorBasedOnZone({
        prdcer_lyr_id,
        user_id: authResponse?.localId,
        color_grid_choice: colors[chosenPallet || 0],
        change_lyr_id,
        based_on_lyr_id: prdcer_lyr_id,
        coverage_value: newRadius,
        coverage_property: selectedBasedon,
        color_based_on: basedOnProperty,
      });
    }
  }

  function handleGridChange() {
    if (isHeatmap) {
      updateLayerHeatmap(layerIndex, false);
      setIsHeatmap(false);
    }
    updateLayerGrid(layerIndex, !isGrid);
    setIsGrid(!isGrid);
  }

  function handleRadiusInputChange(newRadius: number | string) {
    setRadiusInput(newRadius);

    /*setGeoPoints(prev => {
      const updated = [...prev];
      updated[layerIndex] = {
        ...updated[layerIndex],
        radius_meters: newRadius,
        offset_value: newRadius
      };
      return updated;
    });*/

    setReqGradientColorBasedOnZone((prev: any) => ({
      ...prev,
      offset_value: newRadius,
    }));
  }

  const handleColorChange = (color: string) => {
    if (layerIndex !== undefined) {
      // Update layerColors state
      setLayerColors(prev => ({
        ...prev,
        [layerIndex]: color,
      }));

      // Update geoPoints to change the map
      setGeoPoints(prev => {
        const updated = [...prev];
        updated[layerIndex] = {
          ...updated[layerIndex],
          points_color: color,
        };
        return updated;
      });

      // Update map color
      updateLayerColor(layerIndex, color);
    }
  };
  const [selectedColor, setSelectedColor] = useState<string>('#000000');


  const handleNameColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const [thresholdValue, setThresholdValue] = useState('');

  const handleThresholdChange = (value: string) => {
    setThresholdValue(value);
  };
  const handleApplyFilter = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const currentLayer = geoPoints[layerIndex];
      const baseLayer = geoPoints.find(layer => layer.prdcer_lyr_id === basedOnLayerId);
      const selectedColors = colors[chosenPallet || 0];

      if (!currentLayer || !baseLayer || !basedOnProperty || !selectedColors || !selectedBasedon) {
        console.error('Missing required fields');
        return;
      }
      const getFormattedThreshold = () => {
        if (
          basedOnProperty === 'id' ||
          basedOnProperty === 'address' ||
          basedOnProperty === 'phone' ||
          basedOnProperty === 'priceLevel' ||
          basedOnProperty === 'primaryType' ||
          basedOnProperty === '' ||
          basedOnProperty === 'popularity_score_category'
        ) {
          return thresholdValue; // Keep as string
        }

        if (
          basedOnProperty === 'rating' ||
          basedOnProperty === 'heatmap_weight' ||
          basedOnProperty === 'user_ratings_total' ||
          basedOnProperty === 'popularity_score'
        ) {
          return parseFloat(thresholdValue) || 0; // Convert to float
        }

        return thresholdValue; // Default case
      };
      const filterRequest = {
        color_grid_choice: selectedColors,
        change_lyr_id: currentLayer.prdcer_lyr_id,
        change_lyr_name: currentLayer.prdcer_layer_name || `Layer ${currentLayer.layerId}`,
        based_on_lyr_id: baseLayer.prdcer_lyr_id,
        based_on_lyr_name: baseLayer.prdcer_layer_name || `Layer ${baseLayer.layerId}`,
        // coverage_property: selectedBasedon,
        coverage_property: '',

        coverage_value: radiusInput,
        color_based_on: basedOnProperty,
        list_names: nameInputs.filter(name => name.trim() !== ''),
        threshold: getFormattedThreshold(),
        change_lyr_new_color: selectedColor,
      };

      const filterResponse = await handleFilteredZone(filterRequest);

      if (!filterResponse || filterResponse.length === 0) {
        toast.error('No features found based on the given criteria.');
      }
      if (!filterResponse) {
        throw new Error('Filter data failed.');
      }

      setGeoPoints(prevGeoPoints =>
        prevGeoPoints.map(layer => {
          const matchedFilterData = filterResponse.filter(
            filter => filter.bknd_dataset_id === layer.prdcer_lyr_id
          );

          if (matchedFilterData.length > 0) {
            const mergedFeatures = matchedFilterData.flatMap(filter => filter.features || []);

            return {
              ...layer,

              features: mergedFeatures,
              points_color: matchedFilterData[0].points_color || layer.points_color,
            };
          }

          return layer; // Keep other layers unchanged
        })
      );
    } catch (error: any) {
      toast.error('Server error (500). Please try again later.');

    } finally {
      setIsLoading(false);
    }
  };


  // ------------omar code -------

  const handleApplyRecolor = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {

      const currentLayer = geoPoints[layerIndex];
      const baseLayer = geoPoints.find(layer => layer.prdcer_lyr_id === basedOnLayerId);
      const selectedColors = colors[chosenPallet || 0];

      if (!currentLayer || !baseLayer || !basedOnProperty || !selectedColors || !selectedBasedon) {

        return;
      }
    
      // Threshold Formatting
      const getFormattedThreshold = () => {
        if (
          [
            'id',
            'address',
            'phone',
            'priceLevel',
            'primaryType',
            '',
            'popularity_score_category',
          ].includes(basedOnProperty)
        ) {
          return thresholdValue;
        }
        if (
          ['rating', 'heatmap_weight', 'user_ratings_total', 'popularity_score'].includes(
            basedOnProperty
          )
        ) {
          return parseFloat(thresholdValue) || 0;
        }
        return thresholdValue;
      };

      // Prepare request
      const recolorRequest = {
        color_grid_choice: selectedColors,
        change_lyr_id: currentLayer.prdcer_lyr_id,
        change_lyr_name: currentLayer.prdcer_layer_name || `Layer ${currentLayer.layerId}`,
        based_on_lyr_id: baseLayer.prdcer_lyr_id,
        based_on_lyr_name: baseLayer.prdcer_layer_name || `Layer ${baseLayer.layerId}`,
        coverage_property: selectedBasedon,
        coverage_value: radiusInput,
        color_based_on: basedOnProperty,
        list_names: nameInputs.filter(name => name.trim() !== ''),
        threshold: getFormattedThreshold(),
        change_lyr_new_color: selectedColor,
      };

      // Call Filter API (returns matched/unmatched both)
      // const filterResponse = await handleNameBasedColorZone(recolorRequest);

      // if (!filterResponse || filterResponse.length === 0) {
      //   throw new Error('Filter API failed or empty response.');
      // }

      // Prepare Gradient API request
      const gradientRequest = {

        color_grid_choice: selectedColors,
        change_lyr_id: currentLayer.prdcer_lyr_id,
        change_lyr_name: currentLayer.prdcer_layer_name || `Layer ${currentLayer.layerId}`,
        based_on_lyr_id: baseLayer.prdcer_lyr_id,
        based_on_lyr_name: baseLayer.prdcer_layer_name || `Layer ${baseLayer.layerId}`,
        coverage_property: selectedBasedon,
        coverage_value: radiusInput,
        color_based_on: basedOnProperty,
        list_names: nameInputs,


      };

      setReqGradientColorBasedOnZone(gradientRequest);


      //  Call Gradient API
      const gradientData = await handleNameBasedColorZone(recolorRequest);
      


      if (!gradientData || gradientData.length === 0) {
        throw new Error('No gradient data received.');
      }
      setGeoPoints(gradientData);

      // Process gradient data for UI update
      const combinedFeatures = gradientData.flatMap(group =>
        group.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            gradient_color: group.points_color,
            gradient_legend: group.layer_legend,
          },
        }))
      );


      setGeoPoints(prev =>
        prev.map(point =>
          point.prdcer_lyr_id === currentLayer.prdcer_lyr_id
            ? {
                ...point,
                prdcer_layer_name: gradientData[0]?.prdcer_layer_name,
                layer_legend: gradientData.map(g => g.layer_legend).join(' | '),
                records_count: gradientData.reduce((sum, g) => sum + g.records_count, 0),
                features: combinedFeatures,
                gradient_groups: gradientData.map(group => ({
                  color: group.points_color,
                  legend: group.layer_legend,
                  count: group.records_count,
                })),
                is_gradient: true,
                gradient_based_on: baseLayer.prdcer_lyr_id,
              }
            : point
        )
      );
    } catch (error) {

      console.error('Error applying dynamic color:', error);
      setIsError(error instanceof Error ? error : new Error('Failed to apply dynamic color'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedBasedon(value);

    setGeoPoints(prev =>
      prev.map((point, idx) => (idx === layerIndex ? { ...point, basedon: value } : point))
    );
  };

  useEffect(() => {
    const initialColor = layer?.points_color;
    if (initialColor && !layerColors[layerIndex]) {
      setLayerColors(prev => ({
        ...prev,
        [layerIndex]: initialColor,
      }));
    }
  }, [layer, layerIndex, layerColors]);

  const handleDisplayTypeChange = (newType: (typeof DisplayType)[keyof typeof DisplayType]) => {
    if (layer.is_gradient) return;

    const isHeatmapNew = newType === DisplayType.HEATMAP;
    const isGridNew = newType === DisplayType.GRID;

    setDisplayType(newType);
    setIsHeatmap(isHeatmapNew);
    setIsGrid(isGridNew);

    if (isHeatmapNew) {
      setGeoPoints(prev =>
        prev.map((point, idx) => {
          if (idx === layerIndex) {
            return {
              ...point,
              is_heatmap: true,
              features: point.features.map(feature => ({
                ...feature,
                properties: {
                  ...feature.properties,
                  heatmap_weight: 1,
                },
              })),
            };
          }
          return point;
        })
      );
    }

    updateLayerHeatmap(layerIndex, isHeatmapNew);
    updateLayerGrid(layerIndex, isGridNew);
  };

  return (
    <div className="w-full">
      {!isOpen && (
        <div
          className={
            'flex justify-between items-center gap-2.5 py-6 px-3.5 border border-[#ddd] rounded-lg mt-5 bg-white shadow relative transition-all duration-300 h-20 w-full'
          }
        >
          <button
            className="bg-transparent border-none text-[#ff4d4f] text-base cursor-pointer absolute top-[2px] right-[2px] rounded-full h-5 w-5 flex justify-center items-center transition-colors duration-300 hover:bg-[#ff4d4f] hover:text-white"
            onClick={handleRemoveLayer}
          >
            <FaTrash />
          </button>

          <div className="font-bold text-[#333] w-[105px] overflow-hidden">
            <span className="text-sm text-[#333] block truncate" title={prdcer_layer_name}>
              {prdcer_layer_name || layer_legend}
            </span>
          </div>
          <div className="flex">
            <ColorSelect layerId={layerIndex} onColorChange={handleColorChange} />
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={isDisplay}
                onChange={handleDisplayChange}
                className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
              />
              <p className="text-[11px] my-[2px] text-[#555] whitespace-nowrap">Visible</p>
            </div>
          </div>

          <div
            onClick={e => {
              setIsAdvanced(!isAdvanced);
              if (layerIndex != undefined) {
                setIsAdvancedMode(prev => ({
                  ...prev,
                  [`circle-layer-${layerIndex}`]: true,
                }));
              }
              toggleDropdown(e);
            }}
            ref={buttonRef}
            className="text-xl cursor-pointer"
          >
            <IoIosArrowDropdown />
          </div>
        </div>
      )}

      {isOpen && (
        <div className=" w-full">
          <div className="flex flex-col gap-2 mt-4   py-3 px-4 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="flex justify-between items-center">
              <p className="text-base mb-0 capitalize font-medium">
                {prdcer_layer_name || layer_legend}
              </p>
              <div className="flex items-center  gap-2">
                <p className="text-xs mb-0 font-medium">Advanced</p>
                <div
                  onClick={e => {
                    setIsAdvanced(!isAdvanced);

                    toggleDropdown(e);
                  }}
                  className="text-lg cursor-pointer"
                  ref={buttonRef}
                >
                  <RiCloseCircleLine />
                </div>
              </div>
            </div>

            <p className="text-sm mb-0 font-medium">Change display type</p>

            <div
              className={`flex gap-2 ms-2.5 text-sm ${layer.is_gradient ? 'cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="regular-display"
                  name="display-type"
                  value={DisplayType.REGULAR}
                  checked={layer.is_gradient || displayType === DisplayType.REGULAR}
                  onChange={e =>
                    handleDisplayTypeChange(
                      e.target.value as (typeof DisplayType)[keyof typeof DisplayType]
                    )
                  }
                  className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
                  disabled={layer.is_gradient}
                />
                <label
                  htmlFor="regular-display"
                  className={`my-[2px] whitespace-nowrap cursor-pointer ${
                    layer.is_gradient ? 'text-gray-400' : 'text-[#555]'
                  }`}
                >
                  Points
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="heatmap-display"
                  name="display-type"
                  value={DisplayType.HEATMAP}
                  checked={!layer.is_gradient && displayType === DisplayType.HEATMAP}
                  onChange={e =>
                    handleDisplayTypeChange(
                      e.target.value as (typeof DisplayType)[keyof typeof DisplayType]
                    )
                  }
                  className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
                  disabled={layer.is_gradient}
                />
                <label
                  htmlFor="heatmap-display"
                  className={`my-[2px] whitespace-nowrap cursor-pointer ${
                    layer.is_gradient ? 'text-gray-400' : 'text-[#555]'
                  }`}
                >
                  Heatmap
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="grid-display"
                  name="display-type"
                  value={DisplayType.GRID}
                  checked={!layer.is_gradient && displayType === DisplayType.GRID}
                  onChange={e =>
                    handleDisplayTypeChange(
                      e.target.value as (typeof DisplayType)[keyof typeof DisplayType]
                    )
                  }
                  className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
                  disabled={layer.is_gradient}
                />
                <label
                  htmlFor="grid-display"
                  className={`my-[2px] whitespace-nowrap cursor-pointer ${
                    layer.is_gradient ? 'text-gray-400' : 'text-[#555]'
                  }`}
                >
                  Grid
                </label>
              </div>
            </div>
            <div className="flex  justify-between items-center">
              <p className="font-semibold">Conditional</p>
              <div className="flex border-b">
                <button
                  onClick={() => setSelectedOption('recolor')}
                  className={`px-4 py-2 text-sm font-medium flex text-center items-center gap-2 border-b-2 ${
                    selectedOption === 'recolor'
                      ? 'border-primary text-primary font-bold' // Active tab styling
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  Recolor
                </button>
                <button
                  onClick={() => setSelectedOption('filter')}
                  className={`px-4 py-2 text-sm font-medium flex items-center text-center gap-2 border-b-2 ${
                    selectedOption === 'filter'
                      ? 'border-primary text-primary font-bold' // Active tab styling
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  Filter
                </button>
              </div>
            </div>

            <p className="text-sm mt-2 mb-0 font-medium">based on metric</p>

            <BasedOnLayerDropdown
              layerIndex={layerIndex}
              nameInputs={nameInputs}
              setNameInputs={setNameInputs}
              selectedOption={selectedOption}
              setPropertyThreshold={handleThresholdChange}
              onColorChange={handleNameColorChange}
            />

            {/* <BasedOnDropdown layerIndex={layerIndex} /> */}

            {selectedOption === 'recolor' && (
              <>
                <div className="ms-2.5 space-y-2">
                  <label
                    className="block text-xs font-medium text-gray-600"
                    htmlFor="distance-input"
                  >
                    Distance
                  </label>
                  <div className="flex">
                    <div className="relative w-full">
                      <input
                        id="distance-input"
                        type="text"
                        min={1}
                        max={100000}
                        step={1}
                        name="radius"
                        className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-s-lg border 
                              border-e-0 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue={radiusInput}
                        onChange={e => handleRadiusInputChange(e.target.value)}
                        placeholder="Enter distance"
                        required
                      />
                    </div>
                    <select
                      className="flex-shrink-0 z-10 inline-flex items-center py-2 px-1 text-sm font-medium text-center 
                            text-gray-900 bg-gray-100 border border-s-0 border-gray-300 rounded-e-lg hover:bg-gray-200 
                            focus:ring-4 focus:outline-none focus:ring-gray-300"
                      value={selectedBasedon}
                      onChange={handleMetricChange}
                    >
                      <option value="radius">Radius (m)</option>
                      <option value="drive_time">Drive Time (min)</option>
                    </select>
                  </div>
                </div>

                {basedOnProperty && selectedOption === 'recolor' && basedOnProperty !== 'name' && (

                <DropdownColorSelect layerIndex={layerIndex} />
                ) }

              </>
            )}
            <div>
              {selectedOption === 'recolor' ? (
                <button
                  // onClick={e => handleApplyDynamicColor(e)}
                  onClick={e => handleApplyRecolor(e)}
                  disabled={isLoading}
                  className="w-full h-7 text-sm bg-[#115740] text-white font-semibold rounded-md hover:bg-[#123f30] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Applying...
                    </span>
                  ) : (
                    'Recolor'
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={e => handleApplyFilter(e)}
                    disabled={isLoading}
                    className="w-full h-7 text-sm bg-[#115740] text-white font-semibold rounded-md hover:bg-[#123f30] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Applying...
                      </span>
                    ) : (
                      'Filter'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add restore prompt */}
      {showRestorePrompt && deletedTimestamp && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center gap-4">
          <span>Layer removed.</span>
          <button
            onClick={() => {
              restoreLayer(deletedTimestamp);
              setShowRestorePrompt(false);
            }}
            className="text-[#115740] hover:text-[#123f30] font-medium"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

export default MultipleLayersSetting;
