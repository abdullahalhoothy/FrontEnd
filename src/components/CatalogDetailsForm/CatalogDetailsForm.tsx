// src/components/CatalogDetailsForm/CatalogDetailsForm.tsx

import { useState, ChangeEvent } from "react";
import styles from "./CatalogDetailsForm.module.css";
import { useCatalogContext } from "../../context/CatalogContext";
import { HiCheck } from "react-icons/hi";

function CatalogDetailsForm() {
  const {
    legendList,
    subscriptionPrice,
    description,
    name,
    setDescription,
    setName,
    setSubscriptionPrice,
    resetState,
    setFormStage,
    handleSaveCatalog,
    isLoading,
    isError,
    saveResponse
  } = useCatalogContext();

  const [error, setError] = useState<string | null>(null);


  function validateForm() {
    if (!name || !description) {
      setError("All fields are required.");
      return false;
    }
    setError(null);
    return true;
  }

  function handleButtonClick() {
    if (validateForm()) {
      handleSaveCatalog();
    }
  }

  function handleDiscardClick() {
    resetState();
    setName("");
    setDescription("");
    setSubscriptionPrice("");
    setFormStage('catalog')
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { id, value } = event.target;
    switch (id) {
      case "name":
        setName(value);
        break;
      case "description":
        setDescription(value);
        break;
      case "subprice":
        setSubscriptionPrice(value);
        break;
    }
  }

  return (
    <div className="flex flex-col justify-between h-full w-full lg:pr-1.5">
      <div className='flex flex-col mt-7 px-4'>
        {error && <p className=' text-red-500 font-semibold'>{error}</p>}

        <div className="mb-5 flex flex-col w-full">
          <label className='block mb-2 text-md font-medium text-black' htmlFor="legendlist">
            Legend List
          </label>
          <textarea
            id="legendlist"
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            value={
              legendList.length > 0
                ? legendList.join("\n")
                : "No legends at the selected layers"
            }
            readOnly
          ></textarea>
        </div>
        <div className="mb-5 flex flex-col w-full">
          <label className='block mb-2 text-md font-medium text-black' htmlFor="subprice">
            Subscription Price
          </label>
          <input
            type="text"
            id="subprice"
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            value={subscriptionPrice}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5 flex flex-col w-full">
          <label className='block mb-2 text-md font-medium text-black' htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            value={name}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5 flex flex-col w-full">
          <label className='block mb-2 text-md font-medium text-black' htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            rows={5}
            value={description}
            onChange={handleChange}
          ></textarea>
        </div>

      </div>

      {isError && (
        <p className="text-red-500 font-semibold px-4">
          {isError.message}
        </p>
      )}

      <div className="w-full flex-col h-[7%] flex px-2 py-2 select-none border-t">
        <div className="flex h-full w-full space-x-2">
          <button
            onClick={handleDiscardClick}
            className="w-full h-10 bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
                 hover:bg-white transition-all cursor-pointer disabled:text-opacity-55 disabled:hover:bg-slate-100 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Discard
          </button>

          <button
            onClick={handleButtonClick}
            className="w-full h-10 bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] 
            transition-all cursor-pointer disabled:text-opacity-55 disabled:hover:bg-[#115740] disabled:cursor-not-allowed gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving
              </span>
            ) : saveResponse ? (
              <>
                <HiCheck className="h-5 w-5" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CatalogDetailsForm;
