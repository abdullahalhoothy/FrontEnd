import React, { Dispatch, SetStateAction, useState } from "react";
import styles from "./MultipleLayersSetting.module.css";
import { useCatalogContext } from "../../context/CatalogContext";
// Destructure props as an object
interface BasedOnDropdownProps {
  layerIndex?: number;
  selectedBasedon: string;
  setSelectedBasedon: Dispatch<SetStateAction<string>>;
}
export default function BasedOnDropdown({
  layerIndex,
  selectedBasedon,
  setSelectedBasedon,
}: BasedOnDropdownProps) {
  const catalogContext = useCatalogContext();
  const { openDropdownIndex3, setOpenDropdownIndex3 } = catalogContext;

  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndex3 === dropdownIndex;

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();

    setSelectedBasedon(event.target.value);
  };
  return (
    <div className="ms-2.5 flex flex-col">
      <label htmlFor="ratingDropdown" className={`${styles.zl} text-sm`}>
        Based on
      </label>
      <select
        id="ratingDropdown"
        value={selectedBasedon}
        onChange={handleSelectChange}
        className="bg-gray-100 px-2 py-2 text-xs  cursor-pointer"
      >
        <option value="rating">Point Rating</option>
        <option value="priceLevel">Price Level</option>
        <option value="user_ratings_total">User Ratings Total</option>
        <option value="heatmap_weight">Heatmap Weight</option>
      </select>
    </div>
  );
}
