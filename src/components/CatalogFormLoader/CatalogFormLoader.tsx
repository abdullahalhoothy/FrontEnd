import React, { useEffect } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import CatalogMenu from '../CatalogMenu/CatalogMenu';
import CatalogDetailsForm from '../CatalogDetailsForm/CatalogDetailsForm';
import { useUIContext } from '../../context/UIContext';

const CatalogFormLoader = () => {
  const { formStage, resetFormStage } = useCatalogContext();

  const { setSidebarMode } = useUIContext();

  useEffect(() => {
    resetFormStage('catalog');
    setSidebarMode('catalog');
  }, []);

  return (
    <div className="flex-1 lg:h-full">
      {formStage === 'catalog' && <CatalogMenu />}

      {formStage === 'catalogDetails' && <CatalogDetailsForm />}
    </div>
  );
};

export default CatalogFormLoader;
