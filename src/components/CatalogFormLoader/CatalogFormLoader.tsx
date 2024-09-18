import React, { useEffect } from "react";
import { useCatalogContext } from "../../context/CatalogContext";
import CatalogMenu from "../CatalogMenu/CatalogMenu";
import CatalogDetailsForm from "../CatalogDetailsForm/CatalogDetailsForm";
import { useUIContext } from "../../context/UIContext";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";

const CatalogFormLoader = () => {
  const { formStage, resetFormStage } = useCatalogContext();

  const { setSidebarMode } = useUIContext();

  useEffect(() => {
    resetFormStage("catalog");
    setSidebarMode("catalog");
  }, []);

  return (
    <div className="w-96 h-full">
      {formStage === "catalog" && <CatalogMenu />}

      {formStage === "catalogDetails" && <CatalogDetailsForm />}
    </div>
  );
};

export default CatalogFormLoader;
