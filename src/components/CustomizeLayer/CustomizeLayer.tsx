import React, { useState, ChangeEvent, useEffect } from "react";
import styles from "./CustomizeLayer.module.css";
import ColorSelect from "../ColorSelect/ColorSelect";
import { useLayerContext } from "../../context/LayerContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";
import { LayerCustomization } from "../../types/allTypesAndInterfaces";
import LayerCustomizationItem from "../LayerCustomizationItem/LayerCustomizationItem";

function autoFillLegendFormat(data) {
  console.log(data);

  if (!data.selectedCountry || !data.selectedCity) return "";

  // Get country abbreviation (e.g., "Saudi Arabia" -> "SA")
  const countryAbbreviation = data.selectedCountry
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  // Get city
  const city = data.selectedCity;

  // Format included types with spaces around the "+"
  const included = data.includedTypes
    .map((type) => type.replace("_", " "))
    .join(" + ");

  // Only include "not" if excluded types exist
  const excluded =
    data.excludedTypes.length > 0
      ? " + not " +
      data.excludedTypes.map((type) => type.replace("_", " ")).join(" + not ")
      : "";

  // Combine the formatted data
  const result = `${countryAbbreviation} ${city} ${included}${excluded}`;

  return result;
}

function CustomizeLayer() {
  const nav = useNavigate();

  const { isAuthenticated } = useAuth();

  const {
    setReqSaveLayer,
    resetFormStage,
    resetFetchDatasetForm,
    showLoaderTopup,
    reqFetchDataset,
    handleSaveLayer,
    saveResponse,
    layerDataMap,
  } = useLayerContext();

  // Initialize state with empty arrays/objects if undefined
  const [layerCustomizations, setLayerCustomizations] = useState<LayerCustomization[]>([]);
  const [errors, setErrors] = useState<{ [layerId: number]: string }>({});
  const [collapsedLayers, setCollapsedLayers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (reqFetchDataset?.layers?.length > 0) {
      const initialCustomizations = reqFetchDataset.layers.map(layer => ({
        layerId: layer.id,
        name: autoFillLegendFormat({
          ...reqFetchDataset,
          includedTypes: layer.includedTypes || [],
          excludedTypes: layer.excludedTypes || [],
        }),
        legend: autoFillLegendFormat({
          ...reqFetchDataset,
          includedTypes: layer.includedTypes || [],
          excludedTypes: layer.excludedTypes || [],
        }),
        description: '',
        color: '#28A745',
      }));
      setLayerCustomizations(initialCustomizations);
    }
  }, [reqFetchDataset]);

  // Handle changes for a specific layer
  const handleLayerChange = (layerId: number, field: keyof LayerCustomization, value: string) => {
    setLayerCustomizations(prev =>
      prev.map(layer =>
        layer.layerId === layerId
          ? { 
              ...layer, 
              [field]: value,
              // If field is color, ensure it's properly updated
              ...(field === 'color' ? { color: value } : {})
            }
          : layer
      )
    );
  };

  // Validate a single layer
  const validateLayer = (layerId: number) => {
    const layer = layerCustomizations.find(l => l.layerId === layerId);
    if (!layer?.name || !layer?.legend) {
      setErrors(prev => ({
        ...prev,
        [layerId]: "Name and legend are required."
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, [layerId]: '' }));
    return true;
  };

  // Save a single layer
  const saveLayer = async (layerId: number) => {
    if (validateLayer(layerId)) {
      const layerData = layerCustomizations.find(l => l.layerId === layerId);
      if (layerData) {
        await handleSaveLayer(layerData);
      }
    }
  };

  // Save all layers
  const handleSaveAllLayers = async () => {
    const allValid = layerCustomizations.every(layer => validateLayer(layer.layerId));
    if (allValid) {
      await handleSaveLayer({ layers: layerCustomizations });
    }
  };

  // Discard a single layer
  const handleDiscardLayer = (layerId: number) => {
    setLayerCustomizations(prev => prev.filter(l => l.layerId !== layerId));
  };

  // Discard all layers
  const handleDiscardAll = () => {
    resetFetchDatasetForm();
    resetFormStage();
  };

  // Toggle collapse function
  const toggleCollapse = (layerId: number) => {
    setCollapsedLayers(prev => {
      const newSet = new Set(prev);
      prev.has(layerId) ? newSet.delete(layerId) : newSet.add(layerId);
      return newSet;
    });
  };

  return (
    <div className="flex flex-col p-2 max-h-[100%]">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold">Customize Layers</h1>
      </div>
      <div className="flex flex-col h-auto overflow-y-scroll space-y-6 p-2">
        {layerCustomizations.map((layer) => (
          <LayerCustomizationItem
            key={layer.layerId}
            layer={layer}
            isCollapsed={collapsedLayers.has(layer.layerId)}
            error={errors[layer.layerId]}
            onToggleCollapse={toggleCollapse}
            onLayerChange={handleLayerChange}
            onDiscard={handleDiscardLayer}
            onSave={saveLayer}
          />
        ))}
      </div>
      {/* Global Controls */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={handleDiscardAll}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Discard All
        </button>
        <button
          onClick={handleSaveAllLayers}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          Save All
        </button>
      </div>
    </div>
  );
}

export default CustomizeLayer;
