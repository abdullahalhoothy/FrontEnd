import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import styles from "./MultipleLayersSetting.module.css";
import ColorSelect from "../ColorSelect/ColorSelect";
import { useCatalogContext } from "../../context/CatalogContext";
import { MultipleLayersSettingProps } from "../../types/allTypesAndInterfaces";

function MultipleLayersSetting(props: MultipleLayersSettingProps) {
  const { layerIndex } = props;
  const {
    geoPoints,
    updateLayerDisplay,
    // updateLayerZone,
    removeLayer,
  } = useCatalogContext();
  const layer = geoPoints[layerIndex];
  
  const {
    prdcer_layer_name,
    is_zone_lyr,
    display,
  } = layer;

  const [isZoneLayer, setIsZoneLayer] = useState(is_zone_lyr);
  const [isDisplay, setIsDisplay] = useState(display);

  useEffect(
    function () {
      setIsZoneLayer(layer.is_zone_lyr);
      setIsDisplay(layer.display);
    },
    [layer.is_zone_lyr, layer.display]
  );

  // function handleZoneLayerChange() {
  //   updateLayerZone(layerIndex, !isZoneLayer);
  //    setIsZoneLayer(!isZoneLayer);
  // }

  function handleDisplayChange() {
    updateLayerDisplay(layerIndex, !isDisplay);
    setIsDisplay(!isDisplay);
  }

  function handleRemoveLayer() {
    removeLayer(layerIndex);
  }

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} onClick={handleRemoveLayer}>
        <FaTrash />
      </button>
      <div className={styles.label}>
        <span className={styles.text}>{prdcer_layer_name}</span>
      </div>
      <div className={styles.colorSelectContainer}>
        <ColorSelect layerIndex={layerIndex} />
      </div>
      <div className={styles.checkboxesContainer}>
        <div className={styles.checkboxContainer}>
          <p className={styles.zl}>Zone Layer</p>
          <input
            type="checkbox"
            // checked={isZoneLayer}
            // onChange={handleZoneLayerChange}
            className={styles.checkbox}
          />
        </div>
        <div className={styles.checkboxContainer}>
          <p className={styles.zl}>Display</p>
          <input
            type="checkbox"
            checked={isDisplay}
            onChange={handleDisplayChange}
            className={styles.checkbox}
          />
        </div>
      </div>
    </div>
  );
}

export default MultipleLayersSetting;
