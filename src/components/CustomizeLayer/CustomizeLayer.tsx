import React, { useState, ChangeEvent, useEffect } from 'react';
import styles from './CustomizeLayer.module.css';
import ColorSelect from '../ColorSelect/ColorSelect';
import { useLayerContext } from '../../context/LayerContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import SavedIconFeedback from '../SavedIconFeedback/SavedIconFeedback';
import { LayerCustomization, LegendFormatData } from '../../types';
import LayerCustomizationItem from '../LayerCustomizationItem/LayerCustomizationItem';
import { useCatalogContext } from '../../context/CatalogContext';
import { HiCheck, HiExclamation } from 'react-icons/hi';
import { getDefaultLayerColor } from '../../utils/helperFunctions';

function autoFillLegendFormat(data: LegendFormatData): string {
  if (!data.selectedCountry || !data.selectedCity) return '';

  const actionAbbreviation = data.action ? data.action.split(' ')[0] : '';

  const cityAbbreviartion = data.selectedCity.slice(0, 3).toUpperCase();

  const countryAbbreviation = data.selectedCountry
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase();

  const included = data.includedTypes.map((type: string) => type.replace('_', ' ')).join(' + ');

  const excluded =
    data.excludedTypes.length > 0
      ? ' + not ' + data.excludedTypes.map((type: string) => type.replace('_', ' ')).join(' + not ')
      : '';
  // Handle special cases for action
  if (actionAbbreviation === 'full') {
    return `${actionAbbreviation}-${countryAbbreviation}-${cityAbbreviartion}-${included}${excluded}`;
  } else {
    return `${countryAbbreviation}-${cityAbbreviartion}-${included}${excluded}`;
  }
}

function CustomizeLayer() {
  const nav = useNavigate();

  const { isAuthenticated } = useAuth();

  const {
    resetFormStage,
    resetFetchDatasetForm,
    reqFetchDataset,
    handleSaveLayer,
    updateLayerState,
  } = useLayerContext();

  const { removeLayer } = useCatalogContext();

  const [layerCustomizations, setLayerCustomizations] = useState<LayerCustomization[]>([]);
  const [errors, setErrors] = useState<{ [layerId: number]: string }>({});
  const [collapsedLayers, setCollapsedLayers] = useState<Set<number>>(new Set());
  const [savingLayers, setSavingLayers] = useState<Set<number>>(new Set());
  const [savedLayers, setSavedLayers] = useState<Set<number>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [globalSaveError, setGlobalSaveError] = useState<string | null>(null);
  const [allSaved, setAllSaved] = useState(false);

  useEffect(() => {
    if (reqFetchDataset?.layers?.length > 0) {
      const initialCustomizations = reqFetchDataset.layers.map(layer => {
        const legendText = autoFillLegendFormat({
          ...reqFetchDataset,
          includedTypes: layer.includedTypes || [],
          excludedTypes: layer.excludedTypes || [],
        });

        return {
          layerId: layer.id,
          name: legendText,
          legend: legendText,
          description: '',
          color: getDefaultLayerColor(layer.id),
        };
      });

      setLayerCustomizations(initialCustomizations);
    }
  }, [reqFetchDataset]);

  const handleLayerChange = (layerId: number, field: keyof LayerCustomization, value: string) => {
    setLayerCustomizations(prev => {
      const updated = prev.map(layer =>
        layer.layerId === layerId
          ? {
              ...layer,
              [field]: value,
              ...(field === 'color' ? { color: value } : {}),
            }
          : layer
      );
      return updated;
    });

    // Update layer state if the field is 'name'
    if (field === 'name') {
      updateLayerState(layerId, { customName: value });
    }
  };

  const validateLayer = (layerId: number) => {
    const layer = layerCustomizations.find(l => l.layerId === layerId);
    if (!layer?.name || !layer?.legend) {
      setErrors(prev => ({
        ...prev,
        [layerId]: 'Name and legend are required.',
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, [layerId]: '' }));
    return true;
  };

  const saveLayer = async (layerId: number) => {
    if (validateLayer(layerId)) {
      try {
        setSavingLayers(prev => new Set(prev).add(layerId));
        const layerData = layerCustomizations.find(l => l.layerId === layerId);
        if (layerData) {
          await handleSaveLayer({ layers: [layerData] });
          setSavedLayers(prev => new Set(prev).add(layerId));
        }
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          [layerId]: 'Failed to save layer. Please try again.',
        }));
      } finally {
        setSavingLayers(prev => {
          const next = new Set(prev);
          next.delete(layerId);
          return next;
        });
      }
    }
  };

  const handleSaveAllLayers = async () => {
    const allValid = layerCustomizations.every(layer => validateLayer(layer.layerId));
    if (allValid) {
      try {
        setIsSavingAll(true);
        setGlobalSaveError(null);
        const layerIds = layerCustomizations.map(l => l.layerId);
        layerIds.forEach(id => setSavingLayers(prev => new Set(prev).add(id)));

        await handleSaveLayer({ layers: layerCustomizations });

        setSavedLayers(new Set(layerIds));
        setAllSaved(true);
      } catch (error) {
        setGlobalSaveError('Failed to save layers. Please try again.');
        setErrors(prev => ({
          ...prev,
          global: 'Failed to save layers. Please try again.',
        }));
      } finally {
        setIsSavingAll(false);
        setSavingLayers(new Set());
      }
    }
  };

  const handleDiscardLayer = (layerId: number) => {
    setLayerCustomizations(prev => {
      const updated = prev.filter(l => l.layerId !== layerId);
      // If this was the last layer, perform discard all actions
      if (updated.length === 0) {
        resetFetchDatasetForm();
        resetFormStage();
      }
      return updated;
    });
    removeLayer(layerId);
  };

  const handleDiscardAll = () => {
    resetFetchDatasetForm();
    resetFormStage();
  };

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
        {layerCustomizations.map(layer => (
          <div key={layer.layerId}>
            <LayerCustomizationItem
              layer={layer}
              isCollapsed={collapsedLayers.has(layer.layerId)}
              error={errors[layer.layerId]}
              isSaving={savingLayers.has(layer.layerId)}
              isSaved={savedLayers.has(layer.layerId)}
              onToggleCollapse={toggleCollapse}
              onLayerChange={handleLayerChange}
              onDiscard={handleDiscardLayer}
              onSave={saveLayer}
            />
            {/* Progress bar */}
            {!collapsedLayers.has(layer.layerId) && (
              <div className="mt-2 mb-3 px-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Layer Progress</span>
                  <span>{useLayerContext().propsFetchingProgress[layer.layerId] || 89}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${useLayerContext().propsFetchingProgress[layer.layerId] || 89}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Global Controls with Enhanced Feedback */}
      <div className="flex flex-col border-t pt-4">
        {globalSaveError && (
          <div className="mb-3 text-sm text-red-600 flex items-center gap-2">
            <HiExclamation className="h-5 w-5 flex-shrink-0" />
            <span>{globalSaveError}</span>
          </div>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleDiscardAll}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm 
              font-medium text-gray-700 bg-white hover:bg-gray-50 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Discard All
          </button>
          <button
            onClick={handleSaveAllLayers}
            disabled={isSavingAll}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
              font-medium text-white 
              ${allSaved ? 'bg-green-700' : globalSaveError ? 'bg-red-600' : 'bg-green-600'} 
              ${!isSavingAll && 'hover:' + (globalSaveError ? 'bg-red-700' : 'bg-green-700')}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
              flex items-center justify-center gap-2 min-w-[100px]`}
          >
            {isSavingAll ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving All...
              </span>
            ) : allSaved ? (
              <>
                <HiCheck className="h-5 w-5" />
                All Saved
              </>
            ) : globalSaveError ? (
              <>
                <HiExclamation className="h-5 w-5" />
                Retry All
              </>
            ) : (
              'Save All'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizeLayer;
