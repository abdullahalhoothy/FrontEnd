import React from "react";
import { useLayerContext } from "../../context/LayerContext";
import styles from "./CreateLayer.module.css";
import LayerDetailsForm from "../LayerDetailsForm/LayerDetailsForm";
import CustomizeLayer from "../CustomizeLayer/CustomizeLayer";
import SaveOptions from "../SaveOptions/SaveOptions";
import Loader from "../Loader/Loader";
import ErrorIconFeedback from "../ErrorIconFeedback/ErrorIconFeedback";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";

function CreateLayer() {
  const { formStage, loading, isError, saveResponse } =
    useLayerContext();

  function renderContent() {
    if (loading) {
      return <Loader />;
    }

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
        <React.Fragment>
          <h2 className={styles.title}>Create Layer</h2>
          <p>Provide some details to create a new layer.</p>
          {formStage === "initial" && <LayerDetailsForm />}
          {formStage === "secondStep" && <CustomizeLayer />}
        </React.Fragment>
      );
    }

    if (formStage === "thirdStep") {
      return <SaveOptions />;
    }

    return null;
  }

  return <div className={styles.container}>{renderContent()}</div>;
}

export default CreateLayer;
