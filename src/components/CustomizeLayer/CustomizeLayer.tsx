import React, { useState, ChangeEvent, useEffect } from "react";
import styles from "./CustomizeLayer.module.css";
import ColorSelect from "../ColorSelect/ColorSelect";
import { useLayerContext } from "../../context/LayerContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";

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
    incrementFormStage,
    resetFormStage,
    resetFetchDatasetForm,
    selectedColor,
    showLoaderTopup,
    reqFetchDataset,
    handleSaveLayer,
    saveResponse,
  } = useLayerContext();

  const [legend, setLegend] = useState<string>(
    autoFillLegendFormat(reqFetchDataset)
  );
  const [description, setDescription] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleSecondFormChange(
    event: ChangeEvent<
      HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement
    >
  ) {
    const { name, value } = event.target;
    switch (name) {
      case "name":
        setName(value);
        break;
      case "legend":
        setLegend(value);
        break;
      case "description":
        setDescription(value);
        break;
      default:
        break;
    }
  }

  function validateForm() {
    if (!name || !selectedColor || !legend) {
      setError("All fields are required.");
      return false;
    }
    setError(null);
    return true;
  }

  function handleButtonClick() {
    if (validateForm()) {
      const saveLayerData = {
        legend,
        description,
        name,
      };
      setReqSaveLayer(saveLayerData);
      handleSaveLayer(saveLayerData);
      // incrementFormStage(); // This is not needed now as we are not using the third step in the form anymore
    }
  }

  function handleDiscardClick() {
    resetFetchDatasetForm();
    resetFormStage();
  }

  useEffect(() => {
    setLegend(autoFillLegendFormat(reqFetchDataset));
  }, [reqFetchDataset]);
  return (
    <>
      {!!saveResponse ? (
        <div className="flex flex-col items-center p-5">
          <SavedIconFeedback />
        </div>
      ) : (
        <div className="flex flex-col lg:pr-2 w-full h-full">
          <div className="w-full h-full px-4 py-4">
            {error && (
              <div className="mt-3 mb-2 text-red-500 font-semibold">
                {error}
              </div>
            )}
            <div className="mb-5 flex flex-col">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="name"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="p-[10px] border border-[#ccc] rounded bg-[#f9f9f9] text-base focus:border-[#007bff] focus:bg-white focus:outline-none"
                value={name}
                onChange={handleSecondFormChange}
                placeholder="Enter Name"
              />
            </div>
            <div className="mb-5 flex flex-col">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="pointColor"
              >
                Point Color
              </label>
              <ColorSelect />
            </div>
            <div className="mb-5 flex flex-col">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="legend"
              >
                Legend
              </label>
              <textarea
                id="legend"
                name="legend"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                rows={3}
                value={legend}
                onChange={handleSecondFormChange}
                placeholder="Enter Legend"
              />
            </div>
            <div className="mb-5 flex flex-col">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                rows={5}
                value={description}
                onChange={handleSecondFormChange}
                placeholder="Enter Description"
              />
            </div>
          </div>
          <div className="w-full h-[7%] flex  px-2 py-2 select-none border-t lg:mb-0 mb-14">
            <div className="flex h-full w-full space-x-2">
              <button
                onClick={handleDiscardClick}
                className="w-full h-full bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
               hover:bg-white transition-all cursor-pointer"
              >
                Discard
              </button>

              <button
                onClick={(e) => {
                  if (!isAuthenticated) nav("/auth");
                  handleButtonClick(e);
                }}
                disabled={showLoaderTopup}
                className="w-full h-full bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
              >
                {showLoaderTopup ? "Loading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomizeLayer;
