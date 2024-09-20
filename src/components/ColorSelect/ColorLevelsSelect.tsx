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

function ColorLevelsSelect({ layerIndex }: ColorSelectProps) {
  const { sidebarMode } = useUIContext();
  const catalogContext = useCatalogContext();
  const layerContext = useLayerContext();

  const {
    geoPoints,
    openDropdownIndex,
    setOpenDropdownIndex,
    updateLayerColor,
  } = catalogContext;

  const { setSelectedColor, selectedColor } = layerContext;

  const showLoaderTopup = layerContext.showLoaderTopup || false;
  const dropdownIndex = layerIndex ?? -1;
  const colorHex =
    layerIndex !== undefined
      ? geoPoints[layerIndex]?.points_color || ""
      : selectedColor?.hex || "";

  const colorName = colorMap.get(colorHex) || ""; // Get the color name from the map

  const isOpen = openDropdownIndex === dropdownIndex;

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
    updateLayerColor(layerIndex ?? null, hex);
    setSelectedColor({ name: optionName, hex });
    setOpenDropdownIndex(null);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();
    if (showLoaderTopup) {
      console.log("Cannot open dropdown while loading.");
      return;
    }
    if (isOpen) {
      setOpenDropdownIndex(null);
    } else {
      setOpenDropdownIndex(dropdownIndex);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdowns = document.querySelectorAll(
        `.${styles.customSelectContainer}`
      );
      const clickedOutside = Array.from(dropdowns).every(function (dropdown) {
        return !dropdown.contains(target);
      });

      if (clickedOutside) {
        setOpenDropdownIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenDropdownIndex]);

  function renderOptions() {
    return colorOptions.map(({ name, hex }) => {
      return (
        <div
          key={hex}
          className={`${styles.customSelectOption} ${
            sidebarMode === "catalog" ? styles.catalogSelect : ""
          } ${showLoaderTopup ? styles.disabledOption : ""}`}
          onClick={(e) => handleOptionClick(name, hex, e)}
        >
          {sidebarMode !== "catalog" && (
            <span className={styles.optionText}>{name}</span>
          )}
          <span
            className={`${styles.colorCircle} ${
              sidebarMode === "catalog" ? styles.colorCatalog : ""
            }`}
            style={{ backgroundColor: hex }}
          />
        </div>
      );
    });
  }
  const colorFamily = colorOptions.find(({ levels }) =>
    levels.includes(colorHex)
  ) || { name: "", levels: [] };

  function handleColorClick(hex: string) {
    updateLayerColor(layerIndex, hex);
    setSelectedColor(hex);
  }
  function renderColorLevels() {
    return colorFamily.levels.map((hex) => (
      <div
        key={hex}
        className={styles.colorLevel}
        style={{ backgroundColor: hex }}
        onClick={() => handleColorClick(hex)}
      />
    ));
  }
  return (
    <div className={styles.colorSelect}>
      <span>{colorFamily.name || "Select a color"}</span>
      <MdKeyboardArrowDown />
      <div className={styles.colorLevels}>{renderColorLevels()}</div>
    </div>
  );
}

export default ColorLevelsSelect;
