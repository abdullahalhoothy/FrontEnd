import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaTrash } from "react-icons/fa";
import styles from "./MultipleLayersSetting.module.css";
import ColorSelect from "../ColorSelect/ColorSelect";
import { useCatalogContext } from "../../context/CatalogContext";
import {
  GradientColorBasedOnZone,
  MultipleLayersSettingProps,
} from "../../types/allTypesAndInterfaces";
import DropdownColorSelect from "../ColorSelect/DropdownColorSelect";
import { MdArrowDropDown } from "react-icons/md";
import { BiExit } from "react-icons/bi";
import { IoIosArrowDropdown, IoMdClose } from "react-icons/io";
import { RiCloseCircleLine } from "react-icons/ri";
import { HttpReq } from "../../services/apiService";
import urls from "../../urls.json";
import { useAuth } from "../../context/AuthContext";
import BasedOnDropdown from "./BasedOnDropdown";

function MultipleLayersSetting(props: MultipleLayersSettingProps) {
  const { layerIndex } = props;
  const {
    geoPoints,
    updateLayerDisplay,
    updateLayerHeatmap,
    removeLayer,
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
    layerColors,
    setLayerColors,
    setGradientColorBasedOnZone,
    setIsAdvancedMode,
    setIsRadiusMode,
  } = useCatalogContext();
  const layer = geoPoints[layerIndex];
  console.log(layer);
  console.log(geoPoints);
  const { prdcer_layer_name, is_zone_lyr, display, is_heatmap } = layer;
  const [isZoneLayer, setIsZoneLayer] = useState(is_zone_lyr);
  const [isDisplay, setIsDisplay] = useState(display);
  const [isHeatmap, setIsHeatmap] = useState(is_heatmap);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { authResponse } = useAuth();

  const [isError, setIsError] = useState<Error | null>(null);
  const [radiusInput, setRadiusInput] = useState(0);
  const isFirstRender = useRef(true);

  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndices[1] === dropdownIndex;

  useEffect(function () {
    handleGetGradientColors();
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
    // Skip the effect on the first render (e.g., page refresh)
    if (isFirstRender.current) {
      isFirstRender.current = false; // Set to false after the first render
      return;
    }

    // If not the first render and geoPoints has items, store them
    if (geoPoints.length > 0) {
      localStorage.setItem("unsavedGeoPoints", JSON.stringify(geoPoints));
    }
  }, [geoPoints]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenDropdownIndices[1]]);

  function handleDisplayChange() {
    updateLayerDisplay(layerIndex, !isDisplay);
    setIsDisplay(!isDisplay);
  }

  function handleHeatMapChange() {
    updateLayerHeatmap(layerIndex, !isHeatmap);
    setIsHeatmap(!isHeatmap);
  }

  function handleRemoveLayer() {
    const { [`circle-layer-${layerIndex}`]: _, ...remainingLayers } =
      layerColors;
    setGradientColorBasedOnZone([] as GradientColorBasedOnZone[]);
    if (openDropdownIndices[1] == geoPoints.length - 1) {
      updateDropdownIndex(1, null);
    }
    setIsRadiusMode(false);
    removeLayer(layerIndex);
    // Re-index the remaining layers (e.g., rename `circle-layer-x` to reflect new indices)
    const reindexedLayers = Object.keys(remainingLayers).reduce(
      (acc, key, index) => {
        acc[`circle-layer-${index}`] = remainingLayers[key];
        return acc;
      },
      {}
    );
    console.log(reindexedLayers);
    setLayerColors(reindexedLayers);
    // Re-index the `isAdvancedMode` state to reflect updated layer indices
    if (layerIndex != undefined) {
      setIsAdvancedMode((prevState) => {
        const { [`circle-layer-${layerIndex}`]: _, ...remainingModes } =
          prevState;

        // Create a new re-indexed state for `isAdvancedMode`
        const reindexedAdvancedMode = Object.keys(remainingModes).reduce(
          (acc, key, index) => {
            acc[`circle-layer-${index}`] = remainingModes[key];
            return acc;
          },
          {}
        );

        return reindexedAdvancedMode;
      });
    }
    if (openDropdownIndices[1] >= geoPoints.length - 1) {
      updateDropdownIndex(1, geoPoints.length - 2);
    }
    setChosenPallet(null);
    setRadiusInput(undefined);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();

    if (isOpen) {
      updateDropdownIndex(1, null);
    } else {
      updateDropdownIndex(1, dropdownIndex);
    }
  }

  async function handleGetGradientColors() {
    // HttpReq<string[]>(
    //   urls.fetch_gradient_colors,
    //   setColors,
    //   () => {},
    //   () => {},
    //   () => {},
    //   setIsError
    // );
    try {
      const res = await apiRequest({
        url: urls.fetch_gradient_colors,
        method: "get",
      });
      setColors(res.data.data);
    } catch (error) {
      setIsError(error);
    }
  }

  function handleApplyRadius() {
    if (!radiusInput) {
      return null;
    } else {
      setIsRadiusMode(true);
      const prdcer_lyr_id =
        layerIndex == 0
          ? geoPoints[0]?.prdcer_lyr_id
          : layerIndex == 1
          ? geoPoints[1]?.prdcer_lyr_id
          : "";
      const change_lyr_id =
        layerIndex == 0
          ? geoPoints[1]?.prdcer_lyr_id
          : layerIndex == 1
          ? geoPoints[0]?.prdcer_lyr_id
          : "";
      setReqGradientColorBasedOnZone({
        prdcer_lyr_id,
        user_id: authResponse?.localId,
        color_grid_choice: colors[chosenPallet || 0],
        change_lyr_id,
        based_on_lyr_id: prdcer_lyr_id,
        radius_offset: radiusInput || 1000,
        color_based_on: selectedBasedon,
      });

      setRadiusInput(undefined);
    }
  }
  return (
    <div className="w-full">
      {!isOpen && (
        <div
          className={
            "flex justify-between items-center gap-2.5 py-6 px-3.5 border border-[#ddd] rounded-lg mt-5 bg-white shadow relative transition-all duration-300 h-20 w-full"
          }
        >
          <button
            className="bg-transparent border-none text-[#ff4d4f] text-base cursor-pointer absolute top-[2px] right-[2px] rounded-full h-5 w-5 flex justify-center items-center transition-colors duration-300 hover:bg-[#ff4d4f] hover:text-white"
            onClick={handleRemoveLayer}
          >
            <FaTrash />
          </button>

          <div className="font-bold text-[#333] w-[105px]">
            <span className="text-sm text-[#333]">{prdcer_layer_name}</span>
          </div>

          <div className={"flex"}>
            <ColorSelect layerIndex={layerIndex} />
            <input
              type="checkbox"
              checked={isDisplay}
              onChange={handleDisplayChange}
              className="appearance-none w-[11px] h-[11px] cursor-pointer border border-[#28a745] rounded-sm relative"
            />
          </div>

          <div
            onClick={(e) => {
              setIsAdvanced(!isAdvanced);
              if (layerIndex != undefined) {
                setIsAdvancedMode((prev) => ({
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
                {prdcer_layer_name}
              </p>
              <div className="flex items-center  gap-2">
                <p className="text-xs mb-0 font-medium">Advanced</p>
                <div
                  onClick={(e) => {
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

            <p className="text-sm mb-0 font-medium">Recolor based on metric</p>

            <DropdownColorSelect layerIndex={layerIndex} />

            <BasedOnDropdown layerIndex={layerIndex} />
            <div className="ms-2.5">
              <label
                className={`text-[11px] my-[2px] text-[#555] whitespace-nowrap block text-sm`}
                htmlFor="radius"
              >
                radius
              </label>
              <input
                id="radius"
                type="text"
                name="radius"
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-grey-100 focus:border-grey-100 block w-full p-1"
                value={radiusInput}
                onChange={(e) => setRadiusInput(+e.target.value)}
                placeholder="Type radius and press Enter"
              />
            </div>
            <div>
              <button
                onClick={handleApplyRadius}
                className="w-full h-7 text-sm bg-[#115740] text-white  font-semibold rounded-md hover:bg-[#123f30] transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
            <div className="flex items-center gap-1 ms-2.5">
              <input
                type="checkbox"
                checked={isHeatmap}
                onChange={handleHeatMapChange}
                className={`appearance-none w-[11px] h-[11px] cursor-pointer border border-[#28a745] rounded-sm relative text-sm`}
              />
              <p className="text-[11px] my-[2px] text-[#555] whitespace-nowrap">
                Heatmap
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultipleLayersSetting;
