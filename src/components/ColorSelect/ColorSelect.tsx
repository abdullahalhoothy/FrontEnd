import { useEffect, MouseEvent as ReactMouseEvent } from 'react';
import styles from './ColorSelect.module.css';
import { useCatalogContext } from '../../context/CatalogContext';
import { useLayerContext } from '../../context/LayerContext';
import { useUIContext } from '../../context/UIContext';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { colorOptions, colorMap, getDefaultLayerColor } from '../../utils/helperFunctions';
import { ColorSelectProps } from '../../types/allTypesAndInterfaces';

function ColorSelect({ layerId, onColorChange }: ColorSelectProps) {
  const { sidebarMode } = useUIContext();
  const catalogContext = useCatalogContext();
  const { layerStates, updateLayerState, showLoaderTopup } = useLayerContext();

  const { geoPoints, setGeoPoints, openDropdownIndices, updateDropdownIndex, layerColors } =
    catalogContext;

  const layerState = layerStates?.[layerId] || {
    selectedColor: null,
    isLoading: false,
  };

  const dropdownIndex = layerId ?? -1;
  const currentGeoPoint =
    geoPoints.length > 1
      ? geoPoints[0]
      : geoPoints.find(point => String(point.layerId) === String(layerId));
  const colorHex =
    layerState?.selectedColor?.hex ||
    currentGeoPoint?.points_color ||
    currentGeoPoint?.color ||
    getDefaultLayerColor(layerId);
  const colorName = colorMap.get(colorHex) || '';

  const isGradient = geoPoints[layerId]?.is_gradient || false;

  const isOpen = !isGradient && openDropdownIndices[0] === dropdownIndex;

  useEffect(() => {
    const currentGeoPoint = geoPoints.find(point => String(point.layerId) === String(layerId));

    const initialColor =
      currentGeoPoint?.points_color ||
      currentGeoPoint?.color ||
      layerColors[layerId] ||
      getDefaultLayerColor(layerId);

    if (initialColor && initialColor !== layerState?.selectedColor?.hex) {
      updateLayerState(layerId, {
        selectedColor: {
          name: colorMap.get(initialColor) || '',
          hex: initialColor,
        },
      });
    }
  }, [layerId, geoPoints, layerColors]);

  function handleOptionClick(optionName: string, hex: string, event: ReactMouseEvent) {
    event.stopPropagation();
    if (showLoaderTopup) return;

    updateLayerState(layerId, {
      selectedColor: { name: optionName, hex },
    });

    setGeoPoints((prevPoints: MapFeatures[]) =>
      prevPoints.map(point =>
        point.layerId === String(layerId) ? { ...point, points_color: hex, color: hex } : point
      )
    );

    onColorChange(hex);
  }

  function toggleDropdown(event: ReactMouseEvent) {
    event.stopPropagation();
    if (isGradient) return;
    if (showLoaderTopup) {
      console.log('Cannot open dropdown while loading.');
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
      const dropdowns = document.querySelectorAll('.relative.inline-block.w-full');
      const clickedOutside = Array.from(dropdowns).every(function (dropdown) {
        return !dropdown.contains(target);
      });

      if (clickedOutside) {
        updateDropdownIndex(0, null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updateDropdownIndex]);

  function renderOptions() {
    return colorOptions.map(({ name, hex }) => {
      return (
        <div
          key={hex}
          className={`p-2 mx-auto cursor-pointer flex justify-between items-center ${
            sidebarMode === 'catalog' ? styles.catalogSelect : ''
          } ${showLoaderTopup ? styles.disabledOption : ''}`}
          onClick={e => handleOptionClick(name, hex, e)}
        >
          {sidebarMode !== 'catalog' && <span className="mr-2.5">{name}</span>}
          <span
            className={`w-[14px] h-[14px] rounded-full absolute left-[80px]  ${
              sidebarMode === 'catalog' ? 'w-[14px] h-[14px] static' : ''
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
        sidebarMode === 'catalog' ? 'w-[50px]' : ''
      } ${showLoaderTopup ? styles.disabled : ''}`}
    >
      <div
        className={`flex items-center justify-between p-[10px] border border-[#ccc] rounded cursor-pointer ${
          sidebarMode === 'catalog' ? 'border-none p-0' : ''
        } ${isGradient ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: isGradient ? 'transparent' : colorHex }}
          />
          <span className="font-medium">
            {isGradient ? 'Custom' : colorName || 'Select a color'}
          </span>
        </div>
        <MdKeyboardArrowDown className={`text-2xl ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 border rounded z-[1] ${
            sidebarMode === 'catalog'
              ? 'bg-transparent border-none max-w-[35px] left-[5px] top-[30px] flex flex-col justify-center py-[4px]'
              : 'bg-white border-[#ccc]'
          }`}
        >
          {renderOptions()}
        </div>
      )}
    </div>
  );
}

export default ColorSelect;
