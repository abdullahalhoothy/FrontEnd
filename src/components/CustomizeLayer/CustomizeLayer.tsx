import React, { useState, ChangeEvent } from "react";
import styles from "./CustomizeLayer.module.css";
import ColorSelect from "../ColorSelect/ColorSelect";
import { useLayerContext } from "../../context/LayerContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

function CustomizeLayer() {

  const nav = useNavigate()

  const {
    isAuthenticated
  } = useAuth()

  const {
    setReqSaveLayer,
    incrementFormStage,
    resetFormStage,
    resetFetchDatasetForm,
    selectedColor,
    showLoaderTopup,
  } = useLayerContext();


  const [legend, setLegend] = useState<string>("");
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
    if (!name || !selectedColor || !legend || !description) {
      setError("All fields are required.");
      return false;
    }
    setError(null);
    return true;
  }

  function handleButtonClick() {
    if (validateForm()) {
      setReqSaveLayer({
        legend,
        description,
        name,
      });
      incrementFormStage();
    }
  }

  function handleDiscardClick() {
    resetFetchDatasetForm();
    resetFormStage();
  }

  return (
    <div className='flex flex-col pr-2 w-full h-full'>
      <div className="w-full h-full px-4 py-4">
        {error && <div className="mt-3 mb-2 text-red-500 font-semibold">{error}</div>}
        <div className={styles.formGroup}>
          <label className='block mb-2 text-md font-medium text-black' htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={styles.input}
            value={name}
            onChange={handleSecondFormChange}
            placeholder="Enter Name"
          />
        </div>
        <div className={styles.formGroup}>
          <label className='block mb-2 text-md font-medium text-black' htmlFor="pointColor">
            Point Color
          </label>
          <ColorSelect />
        </div>
        <div className={styles.formGroup}>
          <label className='block mb-2 text-md font-medium text-black' htmlFor="legend">
            Legend
          </label>
          <textarea
            id="legend"
            name="legend"
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            rows={3}
            value={legend}
            onChange={handleSecondFormChange}
            placeholder="Enter Legend"
          />
        </div>
        <div className={styles.formGroup}>
          <label className='block mb-2 text-md font-medium text-black' htmlFor="description">
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

      <div className="w-full h-[7%] flex  px-2 py-2 select-none border-t">

        <div className="flex h-full w-full space-x-2">
          <button
            onClick={handleDiscardClick}
            className="w-full h-full bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
                 hover:bg-white transition-all cursor-pointer">
            Discard
          </button>

          <button
            onClick={(e) => {
              if(!isAuthenticated) nav('/auth')
              handleButtonClick(e)
            }}
            disabled={showLoaderTopup}
            className="w-full h-full bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer">
            {showLoaderTopup ? "Loading..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizeLayer;
