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

  return (
    <div
      className={`${styles.customSelectContainer} ${
        sidebarMode === "catalog" ? styles.selectContainerContext : ""
      } ${showLoaderTopup ? styles.disabled : ""}`}
    >
      <div
        className={`${styles.customSelectValue} ${
          sidebarMode === "catalog" ? styles.noBorder : ""
        }`}
        onClick={toggleDropdown}
      >
        {sidebarMode !== "catalog" ? (
          <>
            <span className={styles.selectedText}>
              {colorName || "Select a color"}
            </span>
            <MdKeyboardArrowDown
              className={`${styles.arrowIcon} ${isOpen ? styles.open : ""}`}
            />
          </>
        ) : (
          <>
            <span
              className={`${styles.colorCircle} ${
                sidebarMode === "catalog" ? styles.colorCircleCatalog : ""
              }`}
              style={{ backgroundColor: colorHex }}
            />
          </>
        )}
      </div>
      {isOpen && (
        <div
          className={`${styles.customSelectOptions} ${
            sidebarMode === "catalog" ? styles.CatalogueSelectOptions : ""
          }`}
        >
          {renderOptions()}
        </div>
      )}
    </div>
  );
}

export default ColorSelect;
