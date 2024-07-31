import React, { useEffect, useState, ChangeEvent, useRef } from "react";
import { HttpReq } from "../../services/apiService";
import {
  formatSubcategoryName,
  processData,
} from "../../utils/helperFunctions";
import {
  City,
  FirstFormResponse,

} from "../../types/allTypesAndInterfaces";
import styles from "./LayerDetailsForm.module.css";
import Loader from "../Loader/Loader";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import urls from "../../urls.json";


export interface FormData {
  selectedCountry: string;
  selectedCity: string;
  includedTypes: string[];
  excludedTypes: string[];
}

// Other type definitions...

export interface CategoryData {
  [category: string]: string[];
}


function LayerDetailsForm() {
  const {
    handleNextStep,
    setFirstFormResponse,
    loading,
    setDatasetInfo,
    setCentralizeOnce,
  } = useLayerContext();

  const { setGeoPoints } = useCatalogContext();
  const [categories, setCategories] = useState<CategoryData>({});
  const [textSearchInput, setTextSearchInput] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("new nearby search");
  const [password, setPassword] = useState<string>("");

  const [firstFormData, setFirstFormData] = useState<FormData>({
    selectedCountry: "",
    selectedCity: "",
    includedTypes: [],
    excludedTypes: [],
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesData, setCitiesData] = useState<{ [country: string]: City[] }>({});
  // const [categories, setCategories] = useState<Category[]>([]);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [cityResMessage, setCityResMessage] = useState<string>("");
  const [cityResId, setCityResId] = useState<string>("");
  const [categoriesResMessage, setCategoriesResMessage] = useState<string>("");
  const [categoriesResId, setCategoriesResId] = useState<string>("");
  const [postResponse, setPostResponse] = useState<FirstFormResponse | null>(null);
  const [postResMessage, setPostResMessage] = useState<string>("");
  const [postResId, setPostResId] = useState<string>("");

  const [shouldMoveToNextStep, setShouldMoveToNextStep] = useState<boolean>(false);

  const callCountRef = useRef(0);
  const MAX_CALLS = 10;

  useEffect(() => {
    fetchData();
    setFirstFormResponse("");
    setGeoPoints("");
  }, []);

  function fetchData() {
    HttpReq<string[]>(
      urls.country_city,
      (data) => {
        setCountries(processData(data, setCitiesData));
      },
      setCityResMessage,
      setCityResId,
      setLocalLoading,
      setError
    );

    HttpReq<CategoryData>(
      urls.nearby_categories,
      setCategories,
      setCategoriesResMessage,
      setCategoriesResId,
      setLocalLoading,
      setError
    );
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;
    setFirstFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "selectedCountry") {
      const selectedCountryCities = citiesData[value] || [];
      setCities(selectedCountryCities);
      setFirstFormData((prevData) => ({
        ...prevData,
        selectedCity: "",
      }));
    }
  }

  const handleTypeToggle = (type: string) => {
    setFirstFormData((prevData) => {
      if (prevData.includedTypes.includes(type)) {
        // If currently included, move to excluded
        return {
          ...prevData,
          includedTypes: prevData.includedTypes.filter(t => t !== type),
          excludedTypes: [...prevData.excludedTypes, type]
        };
      } else if (prevData.excludedTypes.includes(type)) {
        // If currently excluded, move to not selected
        return {
          ...prevData,
          excludedTypes: prevData.excludedTypes.filter(t => t !== type)
        };
      } else {
        // If not selected, move to included
        return {
          ...prevData,
          includedTypes: [...prevData.includedTypes, type]
        };
      }
    });
  };

  function validateForm(action: string) {
    if (!firstFormData.selectedCountry || !firstFormData.selectedCity) {
      setError(new Error("Country and city are required."));
      return false;
    }

    if (firstFormData.includedTypes.length === 0 && firstFormData.excludedTypes.length === 0) {
      setError(new Error("At least one category must be included or excluded."));
      return false;
    }

    if (firstFormData.includedTypes.length > 50 || firstFormData.excludedTypes.length > 50) {
      setError(new Error("Up to 50 types can be specified in each type restriction category."));
      return false;
    }

    if (searchType === "text search" && !textSearchInput.trim()) {
      setError(new Error("Text search input cannot be empty or just spaces."));
      return false;
    }

    if (action === "full data" && password.toLowerCase() !== "1235") {
      setError(new Error("Correct password is required for full data."));
      return false;
    }

    setError(null);
    return true;
  }

  function handleButtonClick(action: string) {
    if (validateForm(action)) {
      if (action === "full data") {
        setCentralizeOnce(true);
      }
      setShouldMoveToNextStep(true);
      handleFirstFormApiCall(action);
    }
  }

  function handleFirstFormApiCall(action: string, pageToken?: string) {
    const selectedCity = cities.find((city) => city.name === firstFormData.selectedCity);

    if (!selectedCity) {
      setError(new Error("Selected city not found."));
      return;
    }

    if (callCountRef.current >= MAX_CALLS) {
      console.log("Reached maximum number of API calls");
      handleNextStep();
      return;
    }

    callCountRef.current++;

    const postData = {
      dataset_country: firstFormData.selectedCountry,
      dataset_city: firstFormData.selectedCity,
      includedTypes: firstFormData.includedTypes,
      excludedTypes: firstFormData.excludedTypes,
      action: action,
      search_type: searchType,
      ...(searchType === "text search" && { text_search_input: textSearchInput.trim() }),
      ...(action === "full data" && { password: password }),
      ...(pageToken && { page_token: pageToken }),
    };

    HttpReq<FirstFormResponse>(
      urls.create_layer,
      setPostResponse,
      setPostResMessage,
      setPostResId,
      setLocalLoading,
      setError,
      "post",
      postData
    );
  }

  useEffect(() => {
    if (postResponse) {
      if (!postResponse || typeof postResponse !== "object" || !Array.isArray(postResponse.features)) {
        console.error("Invalid GeoJSON object - no data", postResponse);
        setError(new Error("Input data is not a valid GeoJSON object."));
        return;
      }

      setFirstFormResponse((prevResponse) => {
        if (prevResponse && typeof prevResponse !== "string" && prevResponse && postResponse) {
          const existingFeatures = prevResponse.features || [];
          const newFeatures = postResponse.features || [];
          return {
            ...postResponse,
            features: [...existingFeatures, ...newFeatures],
          };
        }
        return postResponse;
      });

      if (postResponse.bknd_dataset_id && postResponse.prdcer_lyr_id) {
        setDatasetInfo({
          bknd_dataset_id: postResponse.bknd_dataset_id,
          prdcer_lyr_id: postResponse.prdcer_lyr_id,
        });
      }

      if (postResponse.next_page_token && callCountRef.current < MAX_CALLS) {
        handleFirstFormApiCall("full data", postResponse.next_page_token);
      } else {
        handleNextStep();
      }
    }
  }, [postResponse]);

  useEffect(() => {
    if (shouldMoveToNextStep && callCountRef.current >= MAX_CALLS) {
      handleNextStep();
    }
  }, [shouldMoveToNextStep]);

  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="searchType">Search Type:</label>
        <select
          id="searchType"
          name="searchType"
          className={styles.select}
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="old nearby search">Old Nearby Search</option>
          <option value="new nearby search">New Nearby Search</option>
          <option value="nearby but actually text search">Nearby But Actually Text Search</option>
          <option value="text search">Text Search</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password for 'full data'"
        />
      </div>

      {searchType === "text search" && (
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="textSearchInput">Text Search:</label>
          <input
            type="text"
            id="textSearchInput"
            name="textSearchInput"
            className={styles.input}
            value={textSearchInput}
            onChange={(e) => setTextSearchInput(e.target.value)}
            placeholder="Enter search text"
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="country">Country:</label>
        <select
          id="country"
          name="selectedCountry"
          className={styles.select}
          value={firstFormData.selectedCountry}
          onChange={handleChange}
        >
          <option value="" disabled>Select a country</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="city">City:</label>
        <select
          id="city"
          name="selectedCity"
          className={styles.select}
          value={firstFormData.selectedCity}
          onChange={handleChange}
          disabled={!firstFormData.selectedCountry}
        >
          <option value="" disabled>Select a city</option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>{city.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>What are you looking for?</label>
        <div className={styles.categoryContainer}>
          {Object.entries(categories).map(([category, types]) => (
            <div key={category} className={styles.categoryGroup}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <div className={styles.typeList}>
                {types.map((type) => (
                  <button
                    key={type}
                    className={`${styles.typeButton} ${
                      firstFormData.includedTypes.includes(type)
                        ? styles.included
                        : firstFormData.excludedTypes.includes(type)
                        ? styles.excluded
                        : ''
                    }`}
                    onClick={() => handleTypeToggle(type)}
                  >
                    {formatSubcategoryName(type)}
                    <span className={styles.toggleIcon}>
                      {firstFormData.includedTypes.includes(type) ? '✓' : 
                       firstFormData.excludedTypes.includes(type) ? '−' : '+'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {error && <p className={styles.error}>{error.message}</p>}

      <div className={styles.buttonContainer}>
        {localLoading || loading ? (
          <Loader />
        ) : (
          <>
            <button className={styles.button} onClick={() => handleButtonClick("Get Sample")}>
              Get Sample
            </button>
            <button className={styles.button} onClick={() => handleButtonClick("full data")}>
              Full data
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LayerDetailsForm;