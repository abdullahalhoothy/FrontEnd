import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  FaShare,
  FaMapMarkerAlt,
  FaPrint,
  FaPlusCircle,
  FaBuilding,
  FaFlag,
  FaRuler,
  FaBookmark,
} from 'react-icons/fa';
import { IoNavigate } from 'react-icons/io5';
import { BiSearch } from 'react-icons/bi';
import clsx from 'clsx';

type MenuPlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

const isTopLeft = (p: MenuPlacement): p is 'top-left' => p === 'top-left';
const isTopRight = (p: MenuPlacement): p is 'top-right' => p === 'top-right';
const isBottomLeft = (p: MenuPlacement): p is 'bottom-left' => p === 'bottom-left';
const isBottomRight = (p: MenuPlacement): p is 'bottom-right' => p === 'bottom-right';

interface MapMenuProps {
  coordinates: string;
  position: { x: number; y: number };
  lngLat: mapboxgl.LngLat;
  onClose: () => void;
  onSave: (lngLat: mapboxgl.LngLat) => void;
  onAction?: (actionId: string) => void;
}

const menuItems = [
  { id: 'coords', isHeader: true },
  { id: 'save', icon: <FaBookmark size={18} />, text: 'Save this location', enabled: true },
  { id: 'share', icon: <FaShare size={18} />, text: 'Share this location' },
  { id: 'directions_from', icon: <IoNavigate size={18} />, text: 'Directions from here' },
  {
    id: 'directions_to',
    icon: <IoNavigate size={18} className="rotate-180" />,
    text: 'Directions to here',
  },
  { id: 'whats_here', icon: <FaMapMarkerAlt size={18} />, text: "What's here?" },
  { id: 'search_nearby', icon: <BiSearch size={20} />, text: 'Search nearby' },
  { id: 'print', icon: <FaPrint size={18} />, text: 'Print' },
  { id: 'add_missing', icon: <FaPlusCircle size={18} />, text: 'Add a missing place' },
  { id: 'add_business', icon: <FaBuilding size={18} />, text: 'Add your business' },
  { id: 'report_problem', icon: <FaFlag size={18} />, text: 'Report a data problem' },
  { id: 'measure_distance', icon: <FaRuler size={18} />, text: 'Measure distance' },
];

const MapMenu: React.FC<MapMenuProps> = ({
  coordinates,
  position,
  lngLat,
  onClose,
  onSave,
  onAction = actionId => console.log(actionId),
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed', // Use fixed instead of absolute to ensure position is relative to viewport
    visibility: 'hidden',
    opacity: 0,
    zIndex: 1050,
  });
  const [placement, setPlacement] = useState<MenuPlacement>('bottom-right');

  useEffect(() => {
    const calculatePosition = () => {
      if (!menuRef.current) return;

      const menuRect = menuRef.current.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;
      const menuWidth = menuRect.width;
      const menuHeight = menuRect.height;

      const CURSOR_OFFSET = 2;
      const cursorX = position.x;
      const cursorY = position.y;

      // Calculate space available in each direction with the offset
      const spaceRight = innerWidth - (cursorX + CURSOR_OFFSET);
      const spaceLeft = cursorX - CURSOR_OFFSET;
      const spaceBottom = innerHeight - (cursorY + CURSOR_OFFSET);
      const spaceTop = cursorY - CURSOR_OFFSET;

      // Check if each placement would fit on screen
      const fitsBottomRight = spaceRight >= menuWidth && spaceBottom >= menuHeight;
      const fitsBottomLeft = spaceLeft >= menuWidth && spaceBottom >= menuHeight;
      const fitsTopRight = spaceRight >= menuWidth && spaceTop >= menuHeight;
      const fitsTopLeft = spaceLeft >= menuWidth && spaceTop >= menuHeight;

      // Calculate score for each placement (higher is better)
      // Base score: If it fits completely (1.0) + additional space as a percentage of screen size
      const placementScores: Record<MenuPlacement, number> = {
        'bottom-right': fitsBottomRight
          ? 1.0 + (spaceRight / innerWidth) * 0.5 + (spaceBottom / innerHeight) * 0.5
          : 0,
        'bottom-left': fitsBottomLeft
          ? 1.0 + (spaceLeft / innerWidth) * 0.5 + (spaceBottom / innerHeight) * 0.5
          : 0,
        'top-right': fitsTopRight
          ? 1.0 + (spaceRight / innerWidth) * 0.5 + (spaceTop / innerHeight) * 0.5
          : 0,
        'top-left': fitsTopLeft
          ? 1.0 + (spaceLeft / innerWidth) * 0.5 + (spaceTop / innerHeight) * 0.5
          : 0,
      };

      // If no placement fits completely, calculate partial fit scores
      if (!fitsBottomRight && !fitsBottomLeft && !fitsTopRight && !fitsTopLeft) {
        // Calculate how much of the menu would be visible in each position (0.0 to 1.0)
        const visibleRatioBottomRight =
          Math.min(1, spaceRight / menuWidth) * Math.min(1, spaceBottom / menuHeight);
        const visibleRatioBottomLeft =
          Math.min(1, spaceLeft / menuWidth) * Math.min(1, spaceBottom / menuHeight);
        const visibleRatioTopRight =
          Math.min(1, spaceRight / menuWidth) * Math.min(1, spaceTop / menuHeight);
        const visibleRatioTopLeft =
          Math.min(1, spaceLeft / menuWidth) * Math.min(1, spaceTop / menuHeight);

        placementScores['bottom-right'] = visibleRatioBottomRight * 0.9; // slightly penalize for not fitting completely
        placementScores['bottom-left'] = visibleRatioBottomLeft * 0.9;
        placementScores['top-right'] = visibleRatioTopRight * 0.9;
        placementScores['top-left'] = visibleRatioTopLeft * 0.9;
      }

      // Slightly prefer bottom-right for consistency with most apps (unless other placements are significantly better)
      placementScores['bottom-right'] += 0.05;

      let bestPlacement: MenuPlacement = 'bottom-right'; // default
      let bestScore = placementScores['bottom-right'];

      Object.entries(placementScores).forEach(([placement, score]) => {
        if (score > bestScore) {
          bestScore = score;
          bestPlacement = placement as MenuPlacement;
        }
      });

      setPlacement(bestPlacement);

      let top: number;
      let left: number;

      if (isBottomRight(bestPlacement)) {
        left = cursorX + CURSOR_OFFSET;
        top = cursorY + CURSOR_OFFSET;
      } else if (isBottomLeft(bestPlacement)) {
        left = cursorX - menuWidth - CURSOR_OFFSET;
        top = cursorY + CURSOR_OFFSET;
      } else if (isTopRight(bestPlacement)) {
        left = cursorX + CURSOR_OFFSET;
        top = cursorY - menuHeight - CURSOR_OFFSET;
      } else if (isTopLeft(bestPlacement)) {
        left = cursorX - menuWidth - CURSOR_OFFSET;
        top = cursorY - menuHeight - CURSOR_OFFSET;
      } else {
        // Default fallback
        left = cursorX + CURSOR_OFFSET;
        top = cursorY + CURSOR_OFFSET;
      }

      // Apply safety margin to prevent going off-screen
      const SAFETY_MARGIN = 5;
      if (left < SAFETY_MARGIN) left = SAFETY_MARGIN;
      if (top < SAFETY_MARGIN) top = SAFETY_MARGIN;
      if (left + menuWidth > innerWidth - SAFETY_MARGIN)
        left = innerWidth - menuWidth - SAFETY_MARGIN;
      if (top + menuHeight > innerHeight - SAFETY_MARGIN)
        top = innerHeight - menuHeight - SAFETY_MARGIN;

      setStyle(prevStyle => ({
        ...prevStyle,
        top: `${top}px`,
        left: `${left}px`,
        visibility: 'visible',
        opacity: 1,
        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
        transform: 'scale(1)',
        transformOrigin: getTransformOrigin(bestPlacement),
      }));
    };

    const getTransformOrigin = (placement: MenuPlacement): string => {
      if (isTopLeft(placement)) return 'bottom right';
      if (isTopRight(placement)) return 'bottom left';
      if (isBottomLeft(placement)) return 'top right';
      if (isBottomRight(placement)) return 'top left';
      return 'top left'; // default
    };

    // Initial render with slight scale animation
    setStyle(prev => ({
      ...prev,
      transform: 'scale(0.95)',
      opacity: 0,
    }));

    const timer = setTimeout(calculatePosition, 10);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [position, onClose]);

  const handleItemClick = (id: string) => {
    if (id === 'save') {
      onSave(lngLat);
    } else {
      onAction(id);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={clsx(
        'w-64 bg-white rounded-md shadow-xl overflow-hidden border border-gray-200',
        `menu-${placement}`,
        'relative'
      )}
      style={style}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onContextMenu={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onWheel={e => e.stopPropagation()}
    >
      <div className="py-1">
        {menuItems.map(item => {
          if (item.isHeader) {
            return (
              <div
                key={item.id}
                className="px-4 py-2 text-sm font-semibold border-b border-gray-200 text-gray-800 bg-gray-50"
              >
                {coordinates}
              </div>
            );
          }

          const isEnabled = item.enabled === true;

          return (
            <div
              key={item.id}
              className={clsx(
                'flex items-center px-4 py-2 text-sm',
                isEnabled
                  ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              )}
              onClick={() => isEnabled && handleItemClick(item.id)}
            >
              {item.icon && (
                <span
                  className={clsx(
                    'mr-3 w-4 h-4 flex items-center justify-center',
                    isEnabled ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  {item.icon}
                </span>
              )}
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapMenu;
