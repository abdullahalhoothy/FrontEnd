import React, {
  useState,
  useEffect,
  MouseEvent as ReactMouseEvent,
  useMemo,
} from "react";
import styles from "./ColorSelect.module.css";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import { useUIContext } from "../../context/UIContext";
import { MdKeyboardArrowDown } from "react-icons/md";

interface ColorSelectProps {
  layerIndex?: number;
}

function ColorSelect(props: ColorSelectProps) {
  const { layerIndex } = props;
  const { sidebarMode } = useUIContext();
  const {
    selectedLayers,
    updateLayerColor,
    openDropdownIndex,
    setOpenDropdownIndex,
  } = useCatalogContext();
  const {
    colorOptions,
    selectedColor: selectedLayerColor,
    setSelectedColor: setLayerColor,
  } = useLayerContext();

  const defaultIndex = 100;
  const dropdownIndex = layerIndex !== undefined ? layerIndex : defaultIndex;

  const selectedColor =
    sidebarMode === "catalog" && layerIndex !== undefined
      ? selectedLayers[layerIndex].color
      : selectedLayerColor;

  const setSelectedColor =
    sidebarMode === "catalog" && layerIndex !== undefined
      ? function (color: string) {
          updateLayerColor(layerIndex, color);
        }
      : setLayerColor;

  const isOpen = openDropdownIndex === dropdownIndex;

  function handleOptionClick(option: string, event: ReactMouseEvent) {
    event.stopPropagation();
    setSelectedColor(option);
    setOpenDropdownIndex(null);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();
    if (isOpen) {
      setOpenDropdownIndex(null);
    } else {
      setOpenDropdownIndex(dropdownIndex);
    }
  }

  useEffect(
    function () {
      function handleClickOutside(event: MouseEvent) {
        var target = event.target as Node;
        var dropdowns = document.querySelectorAll(
          `.${styles.customSelectContainer}`
        );
        var clickedOutside = Array.from(dropdowns).every(function (dropdown) {
          return !dropdown.contains(target);
        });

        if (clickedOutside) {
          setOpenDropdownIndex(null);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return function () {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    },
    [setOpenDropdownIndex]
  );

  function renderOptions() {
    var options = colorOptions;
    return options.map(function (option) {
      return (
        <div
          key={option}
          className={`${styles.customSelectOption} ${
            sidebarMode === "catalog" ? styles.catalogSelect : ""
          }`}
          onClick={function (e) {
            e.stopPropagation();
            handleOptionClick(option, e);
          }}
        >
          {sidebarMode !== "catalog" && (
            <span className={styles.optionText}>{option}</span>
          )}
          <span
            className={`${styles.colorCircle} ${
              sidebarMode === "catalog" ? styles.colorCatalog : ""
            }`}
            style={{ backgroundColor: option.toLowerCase() }}
          />
        </div>
      );
    });
  }

  return (
    <div
      className={`${styles.customSelectContainer} ${
        sidebarMode === "catalog" ? styles.selectContainerContext : ""
      }`}
    >
      <div
        className={`${styles.customSelectValue} ${
          sidebarMode === "catalog" ? styles.noBorder : ""
        }`}
        onClick={toggleDropdown}
      >
        {sidebarMode !== "catalog" && (
          <>
            <span
              className={
                selectedColor ? styles.selectedText : styles.placeholder
              }
            >
              {selectedColor || "Select a color"}
            </span>
            <MdKeyboardArrowDown
              className={`${styles.arrowIcon} ${isOpen ? styles.open : ""}`}
            />
          </>
        )}
        <span
          className={`${styles.colorCircle} ${
            sidebarMode === "catalog" ? styles.colorCircleCatalog : ""
          }`}
          style={{ backgroundColor: selectedColor.toLowerCase() }}
        />
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
