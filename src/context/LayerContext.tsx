// LayerProvider.js
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { HttpReq } from "../services/apiService";
import {
  FirstFormResponse,
  LayerContextType,
  SaveProducerLayerResponse,
} from "../types/allTypesAndInterfaces";
import urls from "../urls.json";
import { useCatalogContext } from "./CatalogContext";
import userIdData from "../currentUserId.json";
import { colorOptions } from "../utils/helperFunctions";

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider(props: { children: ReactNode }) {
  const { children } = props;
  const { geoPoints, setGeoPoints } = useCatalogContext();

  const [secondFormData, setSecondFormData] = useState({
    pointColor: "",
    legend: "",
    description: "",
    name: "",
  });

  const [formStage, setFormStage] = useState("initial");
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [firstFormResponse, setFirstFormResponse] = useState<
    string | FirstFormResponse
  >("");
  const [saveMethod, setSaveMethod] = useState("");
  const [datasetInfo, setDatasetInfo] = useState<{
    bknd_dataset_id: string;
    prdcer_lyr_id: string;
  } | null>(null);

  const [saveResponse, setSaveResponse] =
    useState<SaveProducerLayerResponse | null>(null);
  const [saveResponseMsg, setSaveResponseMsg] = useState("");
  const [saveReqId, setSaveReqId] = useState("");

  // Define color options and selected color state
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Centralization control state
  const [centralizeOnce, setCentralizeOnce] = useState<boolean>(false);
  const [initialFlyToDone, setInitialFlyToDone] = useState(false);

  // Function to handle progressing to the next step in the form
  function handleNextStep() {
    if (formStage === "initial") {
      setFormStage("secondStep");
    } else if (formStage === "secondStep") {
      setFormStage("thirdStep");
    }
  }

  useEffect(
    function () {
      if (firstFormResponse) {
        setGeoPoints(firstFormResponse as string);
      }
    },
    [firstFormResponse]
  );

  useEffect(
    function () {
      if (geoPoints && typeof geoPoints !== "string" && selectedColor) {
        var updatedGeoPoints = {
          ...geoPoints,
          features: geoPoints.features.map(function (feature) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                color: selectedColor.toLowerCase(),
              },
            };
          }),
        };
        setGeoPoints(updatedGeoPoints);
      }
    },
    [selectedColor, geoPoints]
  );

  // Function to handle the save operation, simulating an API call
  function handleSave() {
    if (!datasetInfo) {
      setIsError(new Error("Dataset information is missing!"));
      console.error("Dataset information is missing!");
      return;
    }

    const userId = userIdData.user_id;

    const postData = {
      prdcer_layer_name: secondFormData.name,
      prdcer_lyr_id: datasetInfo.prdcer_lyr_id,
      bknd_dataset_id: datasetInfo.bknd_dataset_id,
      points_color: secondFormData.pointColor,
      layer_legend: secondFormData.legend,
      layer_description: secondFormData.description,
      user_id: userId,
    };

    setLoading(true);

    // Perform the API call
    HttpReq<SaveProducerLayerResponse>(
      urls.save_producer_layer,
      setSaveResponse,
      setSaveResponseMsg,
      setSaveReqId,
      setLoading,
      setIsError,
      "post",
      postData
    );
  }

  // Function to reset the form stage and related state
  function resetFormStage() {
    setIsError(null);
    setFormStage("initial");
  }

  return (
    <LayerContext.Provider
      value={{
        secondFormData,
        setSecondFormData,
        formStage,
        isError,
        firstFormResponse,
        saveMethod,
        loading,
        saveResponse,
        setFormStage,
        setIsError,
        setFirstFormResponse,
        setSaveMethod,
        setLoading,
        handleNextStep,
        handleSave,
        resetFormStage,
        colorOptions,
        selectedColor,
        setSelectedColor,
        setSaveOption: setSaveMethod,
        datasetInfo,
        setDatasetInfo,
        saveResponseMsg,
        setSaveResponseMsg,
        setSaveResponse,
        setSaveReqId,
        centralizeOnce,
        setCentralizeOnce,
        initialFlyToDone,
        setInitialFlyToDone,
      }}
    >
      {children}
    </LayerContext.Provider>
  );
}

// Hook to use the LayerContext
export function useLayerContext() {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error("useLayerContext must be used within a LayerProvider");
  }
  return context;
}
