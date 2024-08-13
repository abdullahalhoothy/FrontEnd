// src/components/CreateLayer/CreateLayer.tsx

import React from "react";
import { useLayerContext } from "../../context/LayerContext";
import styles from "./FormLoader.module.css";
import FetchDatasetForm from "../FetchDatasetForm/FetchDatasetForm";
import CustomizeLayer from "../CustomizeLayer/CustomizeLayer";
import SaveOptions from "../SaveOptions/SaveOptions";
import Loader from "../Loader/Loader";
import ErrorIconFeedback from "../ErrorIconFeedback/ErrorIconFeedback";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";
import LoaderTopup from "../LoaderTopup/LoaderTopup";

function FormLoader() {
  const { createLayerformStage, loading, isError, saveResponse, showLoaderTopup } =
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
    if (createLayerformStage === "initial" || createLayerformStage === "secondStep") {
      return (
        <>
          <h2 className={styles.title}>Locate</h2>
          <p>What you are looking for.</p>
          {createLayerformStage === "initial" && <FetchDatasetForm />}
          {createLayerformStage === "secondStep" && <CustomizeLayer />}
        </>
      );
    }

    if (createLayerformStage === "thirdStep") {
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

export default FormLoader;
