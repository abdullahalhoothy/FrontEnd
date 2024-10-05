import React, {
  useEffect,
  MouseEvent as ReactMouseEvent,
  useState,
} from "react";
import styles from "./ColorSelect.module.css";
import { useCatalogContext } from "../../context/CatalogContext";
import { useLayerContext } from "../../context/LayerContext";

interface ColorSelectProps {
  layerIndex?: number;
}
function DropdownColorSelect({ layerIndex }: ColorSelectProps) {
  const catalogContext = useCatalogContext();
  const layerContext = useLayerContext();

  const {
    updateLayerColor,
    colors,
    chosenPallet,
    setChosenPallet,
    openDropdownIndices,
    updateDropdownIndex,
  } = catalogContext;

  const showLoaderTopup = layerContext.showLoaderTopup || false;
  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndices[2] === dropdownIndex;

  useEffect(() => {
    setChosenPallet(null);
  }, []);
  useEffect(() => {
    // Only update the layer color if layerIndex is provided
    if (
      layerIndex !== undefined &&
      layerIndex !== null &&
      chosenPallet != null
    ) {
      updateLayerColor(layerIndex, colors[chosenPallet][0]);
    }
  }, [chosenPallet, colors]);

  function handleOptionClick(optionIndex, event: ReactMouseEvent) {
    event.stopPropagation();
    if (showLoaderTopup) {
      console.log("Cannot change colors while loading.");
      return;
    }
    setChosenPallet(optionIndex);
    updateDropdownIndex(2, null);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();
    if (showLoaderTopup) {
      console.log("Cannot open dropdown while loading.");
      return;
    }
    if (isOpen) {
      updateDropdownIndex(2, null);
    } else {
      updateDropdownIndex(2, dropdownIndex);
    }
  }
  return (
    <div className="relative inline-block ms-2.5">
      {/* Selected option display (button to toggle dropdown) */}
      <button
        onClick={toggleDropdown}
        className=" cursor-pointer appearance-none w-full h-5 bg-gradient-to-r border border-gray-200 rounded-lg focus:outline-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${
            colors[chosenPallet || 0]?.join(", ") || ""
          })`,
        }}
      ></button>
      <div className="flex justify-between text-sm text-slate-500">
        <span>Low</span>
        <span>High</span>
      </div>
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute w-full bg-white shadow-lg rounded-lg z-10">
          {colors?.map((colorsPallet, index) => (
            <div
              key={index}
              onClick={(e) => handleOptionClick(index, e)}
              className="cursor-pointer h-5 border border-gray-200"
              style={{
                backgroundImage: `linear-gradient(to right, ${
                  colorsPallet?.join(", ") || ""
                })`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownColorSelect;
