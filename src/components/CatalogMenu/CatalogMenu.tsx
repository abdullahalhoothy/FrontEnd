import { MouseEvent, useEffect, useState } from 'react';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { useCatalogContext } from '../../context/CatalogContext';
import { useLayerContext } from '../../context/LayerContext';
import { useUIContext } from '../../context/UIContext';
import { defaultMapConfig } from '../../hooks/map/useMapInitialization';
import { GradientColorBasedOnZone, topics } from '../../types';
import Chat from '../Chat/Chat';
import ChatTrigger from '../Chat/ChatTrigger';
import DataContainer from '../DataContainer/DataContainer';
import MultipleLayersSetting from '../MultipleLayersSetting/MultipleLayersSetting';

const enableAI = true;

function CatalogMenu() {
  const { openModal, setSidebarMode } = useUIContext();

  const {
    setSelectedContainerType,
    resetState,
    setFormStage,
    setLegendList,
    geoPoints,
    setGeoPoints,
    resetFormStage,
    setLayerColors,
    setIsAdvancedMode,
    setGradientColorBasedOnZone,
    setIsRadiusMode,
    setChosenPallet,
  } = useCatalogContext();

  const { setSelectedCity, setSelectedCountry } = useLayerContext();

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  useEffect(() => {
    const savedGeoPoints = localStorage.getItem('unsavedGeoPoints');
    if (savedGeoPoints && JSON.parse(savedGeoPoints).length > 0) {
      setShowRestorePrompt(true);
    }
  }, []);
  useEffect(
    function () {
      setGeoPoints([]);
    },
    [setGeoPoints]
  );

  useEffect(() => {
    resetFormStage('catalog');
    setSidebarMode('catalog');
  }, []);

  function handleRestoreClick() {
    const savedGeoPoints = localStorage.getItem('unsavedGeoPoints');
    if (savedGeoPoints) {
      setGeoPoints(prevGeoPoints => [...prevGeoPoints, ...JSON.parse(savedGeoPoints)]);
      setSelectedCity(JSON.parse(savedGeoPoints)[0].city_name);
      setSelectedCountry(
        JSON.parse(savedGeoPoints)[0].country_name || defaultMapConfig.fallBackCountry
      );
    }
    localStorage.removeItem('unsavedGeoPoints');
    setShowRestorePrompt(false);
  }

  function openCatalogModal(contentType: 'Catalogue' | 'Layer') {
    setSelectedContainerType(contentType);
    openModal(<DataContainer />);
  }

  function handleAddCatalogClick(event: MouseEvent) {
    openCatalogModal('Catalogue');
  }

  function handleAddLayerClick(event: MouseEvent) {
    openCatalogModal('Layer');
  }

  function handleDiscardClick(event: MouseEvent) {
    setIsAdvancedMode({});
    setGradientColorBasedOnZone([] as GradientColorBasedOnZone[]);
    setIsRadiusMode(false);

    resetState();
    setChosenPallet(null);
    setLayerColors({});
  }

  const safeGeoPoints = Array.isArray(geoPoints) ? geoPoints : [];

  function handleSaveClick() {
    const legends = safeGeoPoints
      .map(function (featureCollection) {
        return featureCollection.layer_legend;
      })
      .filter(function (legend): legend is string {
        return !!legend;
      });

    setLegendList(legends);
    setFormStage('catalogDetails');
    setSidebarMode('catalogDetails');
  }

  return (
    <div className="flex flex-col justify-between h-full w-full lg:pr-1.5">
      <div
        className={`flex flex-col justify-start lg:mt-7 mt-3 ${
          !showRestorePrompt ? 'flex-grow' : ''
        }`}
      >
        <div className="flex justify-between items-center mx-8 my-2">
          <p className={'text-lg font-semibold'}>Datasets</p>
          <button
            className={
              'bg-[#115740] border border-white rounded h-16 w-36 text-white hover:bg-[#28a745] transition-all'
            }
            onClick={handleAddCatalogClick}
          >
            + Add Catalog
          </button>
        </div>
        <div className={'flex justify-between items-center mx-8 my-2'}>
          <p className={'text-lg font-semibold'}>Layers</p>
          <button
            className={
              'bg-white border-2 border-[#115740] rounded h-16 w-36 text-black hover:bg-gray-300 transition-all'
            }
            onClick={handleAddLayerClick}
          >
            + Add Layer
          </button>
        </div>

        {enableAI && (
          <div className="flex relative w-full">
            <ChatTrigger
              title="AI Recolor"
              position="auto"
              cN="flex-grow "
              size="h-12 mx-8"
              colors="bg-gem-gradient border text-gray-200"
              beforeIcon={<FaWandMagicSparkles />}
              afterIcon={<></>}
            />
            <Chat topic={topics.RECOLOR} position="fixed left-[27.5rem] mx-2 inset-y-auto " />
          </div>
        )}

        {showRestorePrompt && (
          <div className="ms-8 me-8 m-auto border-solid rounded border-2 border-[#115740] p-2 mt-5 ">
            <p className="text-lg text-center font-semibold flex pb-3">
              You have unsaved data. Would you like to restore it?
            </p>
            <div className="flex w-full space-x-2">
              <button
                onClick={() => {
                  if (geoPoints.length > 0) {
                    resetState(true);
                  } else {
                    resetState();
                  }
                  setShowRestorePrompt(false);
                }}
                className="w-full h-full bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
              hover:bg-white transition-all cursor-pointer disabled:text-opacity-55 disabled:hover:bg-slate-100 disabled:cursor-not-allowed"
              >
                No
              </button>

              <button
                onClick={handleRestoreClick}
                className="w-full h-full bg-[#115740] border-[#115740] border-2 text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] 
         transition-all cursor-pointer disabled:text-opacity-55 disabled:hover:bg-[#115740] disabled:cursor-not-allowed"
              >
                Yes
              </button>
            </div>
          </div>
        )}
        <div className="block overflow-y-auto overflow-x-hidden h-[calc(100vh-20rem)]">
          <div className="flex flex-col flex-grow justify-start items-center px-4">
            {safeGeoPoints.map(function (_, index) {
              return <MultipleLayersSetting key={index} layerIndex={index} />;
            })}
          </div>
        </div>
      </div>
      <div className="w-full flex-col lg:h-[9%] flex px-2 py-2 select-none border-t lg:mb-0 mb-14">
        <div className="flex w-full space-x-2">
          <button
            disabled={!(safeGeoPoints.length > 0)}
            onClick={handleDiscardClick}
            className="w-full h-10  bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
                 hover:bg-white transition-all cursor-pointer disabled:text-opacity-55 disabled:hover:bg-slate-100 disabled:cursor-not-allowed"
          >
            Discard
          </button>

          <button
            onClick={handleSaveClick}
            disabled={!(safeGeoPoints.length > 0)}
            className="w-full h-10  bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] 
            transition-all cursor-pointer disabled:text-opacity-55 disabled:hover:bg-[#115740] disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default CatalogMenu;
