// src/components/CreateLayer/CreateLayer.tsx

import { useEffect, useState } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import CustomizeLayer from '../CustomizeLayer/CustomizeLayer';
import FetchDatasetForm from '../FetchDatasetForm/FetchDatasetForm';
import { useUIContext } from '../../context/UIContext';

function LayerFormLoader() {
  const { createLayerformStage, resetFormStage } = useLayerContext();

  const { sidebarMode, setSidebarMode } = useUIContext();

  // const [createLayerformStage, _] = useState('initial');

  useEffect(() => {
    resetFormStage();
    setSidebarMode('default');
  }, []);

  return (
    <>
      {createLayerformStage === 'initial' && <FetchDatasetForm />}
      {createLayerformStage === 'secondStep' && <CustomizeLayer />}
    </>
  );
}

export default LayerFormLoader;
