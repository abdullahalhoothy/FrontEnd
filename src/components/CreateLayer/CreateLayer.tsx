// src/components/CreateLayer/CreateLayer.tsx

import React from "react";
import { useLayerContext } from "../../context/LayerContext";
import styles from "./CreateLayer.module.css";
import LayerDetailsForm from "../LayerDetailsForm/LayerDetailsForm";
import CustomizeLayer from "../CustomizeLayer/CustomizeLayer";
import SaveOptions from "../SaveOptions/SaveOptions";
import Loader from "../Loader/Loader";
import ErrorIconFeedback from "../ErrorIconFeedback/ErrorIconFeedback";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";
import LoaderTopup from "../LoaderTopup/LoaderTopup";

function CreateLayer() {
  const { formStage, loading, isError, saveResponse, showLoaderTopup } =
    useLayerContext();

  function renderContent() {
    if (saveResponse) {
      return <SavedIconFeedback />;
    }

    if (isError) {
      return <ErrorIconFeedback />;
    }

    return renderFormContent();
  }

  function renderFormContent() {
    if (formStage === "initial" || formStage === "secondStep") {
      return (
        <>
          <h2 className={styles.title}>Locate</h2>
          <p>What you are looking for.</p>
          {formStage === "initial" && <LayerDetailsForm />}
          {formStage === "secondStep" && <CustomizeLayer />}
        </>
      );
    }

    if (formStage === "thirdStep") {
      return <SaveOptions />;
    }

    return null;
  }

  return (
    <div className={styles.container}>
      {renderContent()}
      {showLoaderTopup && <LoaderTopup />}
    </div>
  );
}

export default CreateLayer;
