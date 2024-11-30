import { useEffect, useState } from "react";
import { HttpReq } from "../../services/apiService";
import {
  formatSubcategoryName,
  processCityData,
} from "../../utils/helperFunctions";
import urls from "../../urls.json";
import { CategoryData, City } from "../../types/allTypesAndInterfaces";
import { useLayerContext } from "../../context/LayerContext";
import styles from "./FetchDatasetForm.module.css";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import apiRequest from "../../services/apiRequest";

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
  const [searchType, setSearchType] = useState<
    "new nearby search" | "text search"
  >("new nearby search");
  const [searchText, setSearchText] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  function handleTypeToggle(type: string) {
    setReqFetchDataset((prevData) => {
      if (prevData.includedTypes.includes(type)) {
        return {
          ...prevData,
          includedTypes: prevData.includedTypes.filter((t) => t !== type),
          excludedTypes: [...prevData.excludedTypes, type],
        };
      } else if (prevData.excludedTypes.includes(type)) {
        return {
          ...prevData,
          excludedTypes: prevData.excludedTypes.filter((t) => t !== type),
        };
      } else {
        return {
          ...prevData,
          includedTypes: [...prevData.includedTypes, type],
        };
      }
    });
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

  return (
    <>
      <div className="flex-1 flex flex-col justify-between overflow-y-auto ">
        <div className="w-full pl-4 pr-2 overflow-y-auto ">
          {isError && (
            <div className="mt-6 text-red-500 font-semibold">
              {isError.message}
            </div>
          )}

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
              onChange={(e) => setSearchType(e.target.value as any)}
            >
              <option value="new nearby search">Category Search</option>
              <option value="text search">Keyword Search</option>
            </select>
          </div>

          {searchType == "text search" && (
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
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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

          <div className="flex flex-col my-5">
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
            <div className="flex flex-col gap-2.5">
              {Object.entries(filteredCategories).map(([category, types]) => (
                <div
                  key={category}
                  className="flex-1 min-w-[200px] whitespace-nowrap"
                >
                  <button
                    className="font-semibold text-lg cursor-pointer flex justify-start items-center w-full hover:bg-gray-200 transition-all rounded"
                    onClick={() => {
                      if (openedCategories.includes(category)) {
                        setOpenedCategories([
                          ...openedCategories.filter((x) => x !== category),
                        ]);
                        return;
                      }
                      setOpenedCategories([
                        ...openedCategories.concat(category),
                      ]);
                    }}
                  >
                    {" "}
                    <span>
                      {openedCategories.includes(category) ? (
                        <FaCaretDown />
                      ) : (
                        <FaCaretRight />
                      )}
                    </span>{" "}
                    {category}
                  </button>

                  <div
                    className={
                      " w-full basis-full overflow-hidden transition-all" +
                      (!openedCategories.includes(category) && " h-0")
                    }
                  >
                    <div className="flex flex-wrap gap-3 mt-3">
                      {(types as string[]).map((type: string) => {
                        const included =
                          reqFetchDataset.includedTypes.includes(type);
                        const excluded =
                          reqFetchDataset.excludedTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            className={`flex items-center justify-between py-2 px-4 bg-[#f0f0f0] border border-[#ccc] rounded cursor-pointer text-[14px] transition-all duration-300 ease-in-out hover:bg-[#e0e0e0] ${
                              included
                                ? "bg-[rgb(40,167,69)] border-[#167a1b] text-white"
                                : excluded
                                ? "bg-[#ffebee] border-[#f44336] text-[#c62828]"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleTypeToggle(type);
                            }}
                          >
                            {formatSubcategoryName(type)}
                            <span className="ml-2 font-bold">
                              {included ? "✓" : excluded ? "−" : "+"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
