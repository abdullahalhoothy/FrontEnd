import { useEffect, MouseEvent as ReactMouseEvent } from "react";
import styles from "./ColorSelect.module.css";
import { useCatalogContext } from "../../context/CatalogContext";
import { useLayerContext } from "../../context/LayerContext";
import { useUIContext } from "../../context/UIContext";
import { MdKeyboardArrowDown } from "react-icons/md";
import { colorOptions } from "../../utils/helperFunctions";

// Create a mapping from hex code to color name
const colorMap = new Map(colorOptions.map(({ name, hex }) => [hex, name]));

interface ColorSelectProps {
  layerId: number;
  onColorChange: (color: string) => void;
}

function ColorSelect({ layerId, onColorChange }: ColorSelectProps) {
  const { sidebarMode } = useUIContext();
  const catalogContext = useCatalogContext();
  const {
    layerStates,
    updateLayerState,
    setSelectedColor,
    selectedColor,
    showLoaderTopup
  } = useLayerContext();

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
    layerColors,
  } = catalogContext;

  const layerState = layerStates?.[layerId] || {
    selectedColor: null,
    isLoading: false
  };

  const dropdownIndex = layerId ?? -1;
  const colorHex = layerState?.selectedColor?.hex || "#28A745";
  const colorName = colorMap.get(colorHex) || "";

  const isOpen = openDropdownIndices[0] === dropdownIndex;

  useEffect(() => {
    const initialColor = geoPoints[layerId]?.points_color || layerColors[layerId];
    if (initialColor) {
      updateLayerState(layerId, {
        selectedColor: {
          name: colorMap.get(initialColor) || '',
          hex: initialColor
        }
      });
    }
  }, [layerId, geoPoints, layerColors]);

  function handleOptionClick(
    optionName: string,
    hex: string,
    event: ReactMouseEvent
  ) {
    
    event.stopPropagation();
    if (showLoaderTopup) return;
    
    updateLayerState(layerId, { 
      selectedColor: { name: optionName, hex } 
    });
    
    onColorChange(hex);
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
  }, [updateDropdownIndex]);

  // Add effect to track color changes
  useEffect(() => {
  }, [layerState, colorHex, layerId]);

  useEffect(() => {
  }, [layerState, colorHex]);

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
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: colorHex }}
          />
          <span className="font-medium">{colorName || "Select a color"}</span>
        </div>
        <MdKeyboardArrowDown
          className={`text-2xl ${isOpen ? "rotate-180" : ""}`}
        />
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