import React, { useEffect, MouseEvent as ReactMouseEvent } from "react";
import styles from "./ColorSelect.module.css";
import { useCatalogContext } from "../../context/CatalogContext";
import { useLayerContext } from "../../context/LayerContext";
import { useUIContext } from "../../context/UIContext";
import { MdKeyboardArrowDown } from "react-icons/md";
import { colorOptions } from "../../utils/helperFunctions";

// Create a mapping from hex code to color name
const colorMap = new Map(colorOptions.map(({ name, hex }) => [hex, name]));

interface ColorSelectProps {
  layerIndex?: number;
}

function ColorSelect({ layerIndex }: ColorSelectProps) {
  const { sidebarMode } = useUIContext();
  const catalogContext = useCatalogContext();
  const layerContext = useLayerContext();

  const {
    geoPoints,
    openDropdownIndices,
    setOpenDropdownIndices,
    updateDropdownIndex,
    updateLayerColor,
    setIsAdvancedMode,
    setIsRadiusMode,
    isAdvancedMode,
    setChosenPallet,
  } = catalogContext;

  const { setSelectedColor, selectedColor } = layerContext;

  const showLoaderTopup = layerContext.showLoaderTopup || false;
  const dropdownIndex = layerIndex ?? -1;
  const colorHex =
    layerIndex !== undefined
      ? isAdvancedMode[`circle-layer-${layerIndex}`] != true
        ? geoPoints[layerIndex]?.points_color
        : "#d4d4d8"
      : selectedColor?.hex || "";

  const colorName = colorMap.get(colorHex) || ""; // Get the color name from the map

  const isOpen = openDropdownIndices[0] === dropdownIndex;

  useEffect(() => {
    setSelectedColor(null);
  }, []);

  function handleOptionClick(
    optionName: string,
    hex: string,
    event: ReactMouseEvent
  ) {
    event.stopPropagation();
    if (showLoaderTopup) {
      console.log("Cannot change colors while loading.");
      return;
    }
    if (layerIndex != undefined) {
      setIsAdvancedMode((prevState) => ({
        ...prevState,
        [`circle-layer-${layerIndex}`]: false, // Toggle the advanced mode for the card with the specific ID
      }));
    }
    setIsRadiusMode(false);
    updateLayerColor(layerIndex ?? null, hex);
    setSelectedColor({ name: optionName, hex });
    updateDropdownIndex(0, null);
    setChosenPallet(null);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();
    if (showLoaderTopup) {
      console.log("Cannot open dropdown while loading.");
      return;
    }
    if (isOpen) {
      updateDropdownIndex(0, null);
    } else {
      updateDropdownIndex(0, dropdownIndex);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdowns = document.querySelectorAll(
        ".relative.inline-block.w-full"
      );
      const clickedOutside = Array.from(dropdowns).every(function (dropdown) {
        return !dropdown.contains(target);
      });

      if (clickedOutside) {
        updateDropdownIndex(0, null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenDropdownIndices[0]]);

  function renderOptions() {
    return colorOptions.map(({ name, hex }) => {
      return (
        <div
          key={hex}
          className={`p-2 mx-auto cursor-pointer flex justify-between items-center ${
            sidebarMode === "catalog" ? styles.catalogSelect : ""
          } ${showLoaderTopup ? styles.disabledOption : ""}`}
          onClick={(e) => handleOptionClick(name, hex, e)}
        >
          {sidebarMode !== "catalog" && <span className="mr-2.5">{name}</span>}
          <span
            className={`w-[14px] h-[14px] rounded-full absolute left-[80px]  ${
              sidebarMode === "catalog" ? "w-[14px] h-[14px] static" : ""
            }`}
            style={{ backgroundColor: hex }}
          />
        </div>
      );
    });
  }

  return (
    <div
      className={`relative inline-block w-full ${
        sidebarMode === "catalog" ? "w-[50px]" : ""
      } ${showLoaderTopup ? styles.disabled : ""}`}
    >
      <div
        className={`flex items-center justify-between p-[10px] border border-[#ccc] rounded cursor-pointer ${
          sidebarMode === "catalog" ? "border-none p-0" : ""
        }`}
        onClick={toggleDropdown}
      >
        {sidebarMode !== "catalog" ? (
          <>
            <span className="font-bold">{colorName || "Select a color"}</span>
            <MdKeyboardArrowDown
              className={`text-2xl ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        ) : (
          <>
            <span
              className={`w-[14px] h-[14px] rounded-full absolute left-[70px] ${
                sidebarMode === "catalog"
                  ? "static min-w-[14px] min-h-[14px] ml-[16px]"
                  : ""
              }`}
              style={{ backgroundColor: colorHex }}
            />
          </>
        )}
      </div>
      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 border rounded z-[1] ${
            sidebarMode === "catalog"
              ? "bg-transparent border-none max-w-[35px] left-[5px] top-[30px] flex flex-col justify-center py-[4px]"
              : "bg-white border-[#ccc]"
          }`}
        >
          {renderOptions()}
        </div>
      )}
    </div>
  );
}

export default ColorSelect;
