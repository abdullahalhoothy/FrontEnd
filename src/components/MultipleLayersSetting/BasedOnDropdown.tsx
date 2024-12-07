import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "./MultipleLayersSetting.module.css";
import { useCatalogContext } from "../../context/CatalogContext";
// Destructure props as an object
interface BasedOnDropdownProps {
  layerIndex?: number;
}
export default function BasedOnDropdown({ layerIndex }: BasedOnDropdownProps) {
  const catalogContext = useCatalogContext();
  const { 
    openDropdownIndices, 
    geoPoints,
    setGeoPoints 
  } = catalogContext;

  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndices[3] === dropdownIndex;
  
  // Get current basedon value safely
  const currentBasedon = layerIndex !== undefined 
    ? geoPoints[layerIndex]?.basedon || 'rating'
    : 'rating';

  useEffect(function () {
    if (layerIndex !== undefined) {
      setGeoPoints(prev => prev.map((point, idx) => 
        idx === layerIndex 
          ? { ...point, basedon: point.basedon || 'rating' }
          : point
      ));
    }
  }, [layerIndex]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    
    if (layerIndex !== undefined) {
      setGeoPoints(prev => prev.map((point, idx) => 
        idx === layerIndex 
          ? { ...point, basedon: event.target.value }
          : point
      ));
    }
  };

  return (
    <div className="ms-2.5 flex flex-col">
      <label htmlFor="ratingDropdown" className={`text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm`}>
        Based on
      </label>
      <select
        id="ratingDropdown"
        value={currentBasedon}
        onChange={handleSelectChange}
        className="bg-gray-100 px-2 py-2 text-xs cursor-pointer"
      >
        <option value="rating">Point Rating</option>
        <option value="priceLevel">Price Level</option>
        <option value="user_ratings_total">User Ratings Total</option>
        <option value="heatmap_weight">Heatmap Weight</option>
      </select>
    </div>
  );
}