import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaTrash } from "react-icons/fa";
import styles from "./MultipleLayersSetting.module.css";
import ColorSelect from "../ColorSelect/ColorSelect";
import { useCatalogContext } from "../../context/CatalogContext";
import { MultipleLayersSettingProps } from "../../types/allTypesAndInterfaces";
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
    selectedBasedon,
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
  useEffect(
    function () {
      if (geoPoints.length >= 0) {
        localStorage.setItem("unsavedGeoPoints", JSON.stringify(geoPoints));
      }
    },
    [geoPoints]
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
    removeLayer(layerIndex);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();

    if (isOpen) {
      updateDropdownIndex(1, null);
    } else {
      updateDropdownIndex(1, dropdownIndex);
    }
  }
  function handleGetGradientColors() {
    HttpReq<string[]>(
      urls.fetch_gradient_colors,
      setColors,
      () => {},
      () => {},
      () => {},
      setIsError
    );
  }

  function handleRadiusChange(event: React.KeyboardEvent<HTMLInputElement>) {
    console.log("Key pressed:", event.key);
    if (event.key === "Enter") {
      event.preventDefault();
      console.log("Key pressed");
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
        color_grid_choice: colors[chosenPallet],
        change_lyr_id,
        based_on_lyr_id: prdcer_lyr_id,
        radius_offset: radiusInput || 1000,
        color_based_on: selectedBasedon,
      });

      setRadiusInput(0);
    }
  }
  return (
    <div className="w-full">
      {!isOpen && (
        <div className={styles.container + " h-20 w-full"}>
          <button className={styles.closeButton} onClick={handleRemoveLayer}>
            <FaTrash />
          </button>

          <div className={styles.label}>
            <span className={styles.text}>{prdcer_layer_name}</span>
          </div>

          <div className={"flex"}>
            <ColorSelect layerIndex={layerIndex} />
            <input
              type="checkbox"
              checked={isDisplay}
              onChange={handleDisplayChange}
              className={styles.checkbox}
            />
          </div>

          <div
            onClick={(e) => {
              setIsAdvanced(!isAdvanced);
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
                className={`${styles.zl} block text-sm`}
                htmlFor="passwordKey"
              >
                radius
              </label>
              <input
                id="radius"
                type="text"
                name="radius"
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-sm focus:ring-grey-100 focus:border-grey-100 block w-full p-1"
                value={radiusInput}
                onChange={(e) => setRadiusInput(+e.target.value)}
                onKeyDown={handleRadiusChange}
                placeholder="Type radius and press Enter"
              />
            </div>
            <div className="flex items-center gap-1 ms-2.5">
              <input
                type="checkbox"
                checked={isHeatmap}
                onChange={handleHeatMapChange}
                className={`${styles.checkbox} text-sm`}
              />
              <p className={styles.zl}>Heatmap</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultipleLayersSetting;