import { useEffect, useState, useRef } from "react";
import { HttpReq } from "../../services/apiService";
import {
  formatSubcategoryName,
  processCityData,
} from "../../utils/helperFunctions";
import urls from "../../urls.json";
import { CategoryData, City, Layer } from "../../types/allTypesAndInterfaces";
import { useLayerContext } from "../../context/LayerContext";
import styles from "./FetchDatasetForm.module.css";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import apiRequest from "../../services/apiRequest";
import LayerDisplaySubCategories from "../LayerDisplaySubCategories/LayerDisplaySubCategories";
import CategoriesBrowserSubCategories from "../CategoriesBrowserSubCategories/CategoriesBrowserSubCategories";

const FetchDatasetForm = () => {
  const nav = useNavigate();

  // LAYER CONTEXT
  const {
    reqFetchDataset,
    setReqFetchDataset,
    validateFetchDatasetForm,
    setCentralizeOnce,
    setShowLoaderTopup,
    incrementFormStage,
    handleFetchDataset,
    resetFetchDatasetForm,
    searchType,
    setSearchType,
    textSearchInput,
    setTextSearchInput,
  } = useLayerContext();

  // AUTH CONTEXT
  const { isAuthenticated } = useAuth();

  // FETCHED DATA
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesData, setCitiesData] = useState<{ [country: string]: City[] }>(
    {}
  );
  const [categories, setCategories] = useState<CategoryData>({});

  // COLBASE CATEGORY
  const [openedCategories, setOpenedCategories] = useState<string[]>([]);

  // ERROR
  const [isError, setIsError] = useState<Error | null>(null);

  // USER INPUT
  const [password, setPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Update layers state with new type
  const [layers, setLayers] = useState<Layer[]>([]);

  // Add ref for the categories section
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetFetchDatasetForm();
    handleGetCountryCityCategory();
  }, []);

  useEffect(() => {
    console.log(reqFetchDataset);
  }, [reqFetchDataset]);

  const filteredCategories = Object.entries(categories).reduce(
    (acc, [category, types]) => {
      const filteredTypes = (types as string[]).filter((type) =>
        type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredTypes.length > 0) {
        acc[category] = filteredTypes;
      }
      return acc;
    },
    {} as CategoryData
  );

  async function handleGetCountryCityCategory() {
    // HttpReq<string[]>(
    //   urls.country_city,
    //   (data) => setCountries(processCityData(data, setCitiesData)),
    //   () => {},
    //   () => {},
    //   () => {},
    //   setIsError
    // );
    try {
      const res = await apiRequest({
        url: urls.country_city,
        method: "get",
      });
      setCountries(processCityData(res.data.data, setCitiesData));
    } catch (error) {
      setIsError(error);
    }

    try {
      const res = await apiRequest({
        url: urls.nearby_categories,
        method: "get",
      });
      setCategories(res.data.data);
    } catch (error) {
      setIsError(error);
    }

    // HttpReq<CategoryData>(
    //   urls.nearby_categories,
    //   setCategories,
    //   () => {},
    //   () => {},
    //   () => {},
    //   setIsError
    // );
  }

  function handleCountryCitySelection(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name: changed_select_element, value } = event.target;

    // Update the reqFetchDataset state using the functional update form
    setReqFetchDataset((prevData) => ({
      ...prevData, // Spread the previous state
      [changed_select_element]: value, // Update the field corresponding to the changed select element
    }));

    // Check if the changed select element is the country selector
    if (changed_select_element === "selectedCountry") {
      setSelectedCountry(value);
      const selectedCountryCities = citiesData[value] || [];

      setCities(selectedCountryCities);

      // Reset the selected city in the reqFetchDataset state
      setReqFetchDataset((prevData) => ({
        ...prevData, // Spread the previous state
        selectedCity: "", // Clear the selected city
      }));
    } else {
      setSelectedCity(value);
    }
  }

  function handleButtonClick(
    action: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();

    const result = validateFetchDatasetForm();

    console.log("Result", result);

    if (result === true) {
      if (action === "full data") {
        setCentralizeOnce(true);
      }
      setShowLoaderTopup(true);
      incrementFormStage();
      handleFetchDataset(action);
    } else if (result instanceof Error) {
      setIsError(result);
      return false;
    }
  }
  function handleClear() {
    setReqFetchDataset((prevData) => ({
      ...prevData,
      includedTypes: [],
      excludedTypes: [],
    }));
  }

  // Add scroll handler function
  const scrollToCategories = (e: React.MouseEvent) => {
    e.preventDefault();
    categoriesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Add new handler to remove type from specific layer
  const removeTypeFromLayer = (type: string, layerId: number, isExcluded: boolean) => {
    setLayers(layers.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          includedTypes: isExcluded ? layer.includedTypes : layer.includedTypes.filter(t => t !== type),
          excludedTypes: isExcluded ? layer.excludedTypes.filter(t => t !== type) : layer.excludedTypes
        };
      }
      return layer;
    }).filter(layer => layer.includedTypes.length > 0 || layer.excludedTypes.length > 0));

    // Update reqFetchDataset based on remaining types
    const remainingIncluded = layers.flatMap(layer => layer.includedTypes);
    const remainingExcluded = layers.flatMap(layer => layer.excludedTypes);

    setReqFetchDataset(prevData => ({
      ...prevData,
      includedTypes: remainingIncluded,
      excludedTypes: remainingExcluded
    }));
  };

  // Update getTypeCounts to return layer IDs with the counts
  const getTypeCounts = (type: string) => {
    const includedInLayers = layers
      .filter(layer => layer.includedTypes.includes(type))
      .map(layer => layer.id);
    const excludedInLayers = layers
      .filter(layer => layer.excludedTypes.includes(type))
      .map(layer => layer.id);

    return {
      includedCount: includedInLayers,
      excludedCount: excludedInLayers
    };
  };

  // Add this helper function
  const addTypeToFirstAvailableLayer = (type: string, setAsExcluded: boolean) => {
    setLayers(prevLayers => {
      // Log the current state
      console.log('Current layers:', prevLayers);
      
      // If no layers exist, create first layer
      if (prevLayers.length === 0) {
        const newLayer: Layer = {
          id: 1,
          name: 'Layer 1',
          includedTypes: setAsExcluded ? [] : [type],
          excludedTypes: setAsExcluded ? [type] : []
        };
        console.log('Creating first layer:', newLayer);
        return [newLayer];
      }

      // Try to find first layer that doesn't have this type
      let targetLayerIndex = prevLayers.findIndex(layer => 
        !layer.includedTypes.includes(type) && !layer.excludedTypes.includes(type)
      );

      console.log('Target layer index:', targetLayerIndex);

      // If all existing layers have this type, create new layer
      if (targetLayerIndex === -1) {
        const newLayer: Layer = {
          id: prevLayers.length + 1,
          name: `Layer ${prevLayers.length + 1}`,
          includedTypes: setAsExcluded ? [] : [type],
          excludedTypes: setAsExcluded ? [type] : []
        };
        console.log('Creating new layer:', newLayer);
        return [...prevLayers, newLayer];
      }

      // Add to first available layer
      const updatedLayers = prevLayers.map((layer, index) => {
        if (index === targetLayerIndex) {
          const updatedLayer = {
            ...layer,
            includedTypes: setAsExcluded 
              ? layer.includedTypes 
              : [...layer.includedTypes, type],
            excludedTypes: setAsExcluded 
              ? [...layer.excludedTypes, type]
              : layer.excludedTypes
          };
          console.log('Updating layer:', updatedLayer);
          return updatedLayer;
        }
        return layer;
      });

      console.log('Updated layers:', updatedLayers);
      return updatedLayers;
    });
  };

  // Replace handleAddToIncluded and handleAddToExcluded with:
  const handleAddToIncluded = (type: string) => {
    addTypeToFirstAvailableLayer(type, false);
  };

  const handleAddToExcluded = (type: string) => {
    addTypeToFirstAvailableLayer(type, true);
  };

  const handleToggleCategory = (category: string) => {
    if (openedCategories.includes(category)) {
      setOpenedCategories([...openedCategories.filter((x) => x !== category)]);
      return;
    }
    setOpenedCategories([...openedCategories.concat(category)]);
  };

  // Add this new function
  const toggleTypeInLayer = (type: string, layerId: number, setAsExcluded: boolean) => {
    setLayers(prevLayers => prevLayers.map(layer => {
      if (layer.id === layerId) {
        // If trying to exclude
        if (setAsExcluded) {
          // Check if it's already excluded
          if (layer.excludedTypes.includes(type)) {
            return layer; // No change needed
          }
          // Move from included to excluded
          return {
            ...layer,
            includedTypes: layer.includedTypes.filter(t => t !== type),
            excludedTypes: [...layer.excludedTypes, type]
          };
        }
        // If trying to include
        else {
          // Check if it's already included
          if (layer.includedTypes.includes(type)) {
            return layer; // No change needed
          }
          // Move from excluded to included
          return {
            ...layer,
            excludedTypes: layer.excludedTypes.filter(t => t !== type),
            includedTypes: [...layer.includedTypes, type]
          };
        }
      }
      return layer;
    }));

    // Update reqFetchDataset based on all layers
    const allIncludedTypes = new Set<string>();
    const allExcludedTypes = new Set<string>();

    layers.forEach(layer => {
      layer.includedTypes.forEach(t => allIncludedTypes.add(t));
      layer.excludedTypes.forEach(t => allExcludedTypes.add(t));
    });

    setReqFetchDataset(prevData => ({
      ...prevData,
      includedTypes: Array.from(allIncludedTypes),
      excludedTypes: Array.from(allExcludedTypes)
    }));
  };

  // Add this handler
  const handleLayerNameChange = (index: number, newName: string) => {
    const newLayers = [...layers];
    newLayers[index].name = newName;
    setLayers(newLayers);
  };

  return (
    <>
      <div className="flex-1 flex flex-col justify-between overflow-y-auto ">
        <div className="w-full pl-4 pr-2 overflow-y-auto ">
          {isError && (
            <div className="mt-6 text-red-500 font-semibold">
              {isError.message}
            </div>
          )}

          <label
            className="block mb-2 text-base font-medium text-black"
            htmlFor="layers"
          >
            Layers
          </label>
          {/* Div to contain all layers should looke like a sub-section with border */}
          <div id="layers" className="flex text-sm flex-col border border-gray-300 rounded-lg p-4 gap-4">
            {/* Map through layers to create multiple Layer sections */}
            {layers.map((layer, index) => (
              <LayerDisplaySubCategories
                key={layer.id}
                layer={layer}
                layerIndex={index}
                onRemoveType={removeTypeFromLayer}
                onToggleTypeInLayer={toggleTypeInLayer}
                onNameChange={handleLayerNameChange}
              />
            ))}

            {/* Add default empty layer section */}
            <div className="">
              <label
                className="block mb-2 font-medium text-black"
                htmlFor="selectedCategories-default"
              >
                Add Layer
              </label>
              <div
                id="selectedCategories-default"
                className="flex gap-2 overflow-x-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <button
                  type="button"
                  className={`flex items-center justify-between py-2 px-4 bg-[#f0f0f0] border border-[#ccc] rounded cursor-pointer text-[14px] transition-all duration-300 ease-in-out hover:bg-[#e0e0e0]`}
                  onClick={scrollToCategories}
                >
                  {formatSubcategoryName("Category")}
                  <span className="ml-2 font-bold">{"+"}</span>
                </button>
              </div>
            </div>

          </div>

          <div className="pt-4">
            <label
              className="block mb-2 text-md font-medium text-black"
              htmlFor="searchType"
            >
              Search Type
            </label>
            <select
              name="searchType"
              id="searchType"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={searchType}
              onChange={(e) => {
                console.log("searchType", e.target.value);
                setSearchType(e.target.value as any)
              }}
            >
              <option value="category_search">Category Search</option>
              <option value="keyword_search">Keyword Search</option>
            </select>
          </div>

          {searchType == "keyword_search" && (
            <div className="pt-4">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="textSearchInput"
              >
                Search
              </label>
              <input
                type="text"
                id="textSearchInput"
                name="textSearchInput"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Enter search text"
                value={textSearchInput}
                onChange={(e) => setTextSearchInput(e.target.value)}
              />
            </div>
          )}
          <div className="pt-4">
            <label
              className="block mb-2 text-md font-medium text-black"
              htmlFor="country"
            >
              Country
            </label>
            <select
              id="country"
              name="selectedCountry"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={selectedCountry}
              onChange={handleCountryCitySelection}
            >
              <option value="" disabled selected hidden>
                Select a country
              </option>
              {countries.map((country) => (
                <option value={country} key={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <label
              className="block mb-2 text-md font-medium text-black"
              htmlFor="city"
            >
              City
            </label>
            <select
              id="city"
              name="selectedCity"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={selectedCity}
              onChange={handleCountryCitySelection}
              disabled={!selectedCountry}
            >
              <option value="" disabled selected hidden>
                Select a city
              </option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {searchType !== "keyword_search" && (
            <div className="flex flex-col my-5" ref={categoriesRef}>
              <div className="flex justify-between">
                <label className="mb-4 font-bold">
                  What are you looking for?
                </label>
                <button
                  onClick={handleClear}
                  className="w-16 h-6 text-sm bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="pb-3">
                <input
                  type="text"
                  id="searchInput"
                  name="searchInput"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Search for a type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <CategoriesBrowserSubCategories
                categories={filteredCategories}
                openedCategories={openedCategories}
                onToggleCategory={handleToggleCategory}
                getTypeCounts={getTypeCounts}
                onRemoveType={removeTypeFromLayer}
                onAddToIncluded={handleAddToIncluded}
                onAddToExcluded={handleAddToExcluded}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex-col flex  px-2 py-2 select-none border-t lg:mb-0 mb-14">
        <div className="flex space-x-2">
          <button
            onClick={(e) => handleButtonClick("sample", e)}
            className="w-full h-10 bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
                 hover:bg-white transition-all cursor-pointer"
          >
            Get Sample
          </button>

          <button
            className="w-full h-10 bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
            onClick={(e) => {
              if (!isAuthenticated) nav("/auth");
              handleButtonClick("full data", e);
            }}
          >
            Full Data
          </button>
        </div>
      </div>
    </>
  );
};

export default FetchDatasetForm;
