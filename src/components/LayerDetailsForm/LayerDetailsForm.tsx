import React, { useEffect, useState, ChangeEvent, useRef } from "react";
import { HttpReq } from "../../services/apiService";
import {
  formatSubcategoryName,
  processData,
} from "../../utils/helperFunctions";
import {
  City,
  FirstFormResponse,
  FormData,
} from "../../types/allTypesAndInterfaces";
import styles from "./LayerDetailsForm.module.css";
import Loader from "../Loader/Loader";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import urls from "../../urls.json";

function LayerDetailsForm() {
  const {
    handleNextStep,
    setFirstFormResponse,
    loading,
    setDatasetInfo,
    setCentralizeOnce,
  } = useLayerContext();

  const { setGeoPoints } = useCatalogContext();

  const [textSearchInput, setTextSearchInput] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("new nearby search");
  const [password, setPassword] = useState<string>("");

  const [firstFormData, setFirstFormData] = useState<FormData>({
    selectedCountry: "",
    selectedCity: "",
    selectedCategory: "",
    selectedSubcategory: "",
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesData, setCitiesData] = useState<{ [country: string]: City[] }>(
    {}
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [categoriesData, setCategoriesData] = useState<{
    [category: string]: string[];
  }>({});
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // City request response information
  const [cityResMessage, setCityResMessage] = useState<string>("");
  const [cityResId, setCityResId] = useState<string>("");

  // Categories request response information
  const [categoriesResMessage, setCategoriesResMessage] = useState<string>("");
  const [categoriesResId, setCategoriesResId] = useState<string>("");

  // Nearby_cities post response information
  const [postResponse, setPostResponse] = useState<FirstFormResponse | null>(
    null
  );
  const [postResMessage, setPostResMessage] = useState<string>("");
  const [postResId, setPostResId] = useState<string>("");

  const [shouldMoveToNextStep, setShouldMoveToNextStep] =
    useState<boolean>(false);

  const callCountRef = useRef(0);
  const MAX_CALLS = 10;

  function fetchData() {
    HttpReq<string[]>(
      urls.country_city,
      function (data) {
        setCountries(processData(data, setCitiesData));
      },
      setCityResMessage,
      setCityResId,
      setLocalLoading,
      setError
    );

    HttpReq<string[]>(
      urls.nearby_categories,
      function (data) {
        setCategories(processData(data, setCategoriesData));
      },
      setCategoriesResMessage,
      setCategoriesResId,
      setLocalLoading,
      setError
    );
  }

  useEffect(function () {
    fetchData();
    setFirstFormResponse("");
    setGeoPoints("");
  }, []);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;
    setFirstFormData(function (prevData) {
      return {
        ...prevData,
        [name]: value,
      };
    });

    if (name === "selectedCountry") {
      const selectedCountryCities = citiesData[value] || [];
      setCities(selectedCountryCities);
      setFirstFormData(function (prevData) {
        return {
          ...prevData,
          selectedCity: "", // Reset selected city when country changes
        };
      });
    } else if (name === "selectedCategory") {
      const selectedSubcategories = categoriesData[value] || [];
      setSubcategories(selectedSubcategories);
      setFirstFormData(function (prevData) {
        return {
          ...prevData,
          selectedSubcategory: "", // Reset selected subcategory when category changes
        };
      });
    }
  }

  function validateForm(action: string) {
    if (
      !firstFormData.selectedCountry ||
      !firstFormData.selectedCity ||
      !firstFormData.selectedCategory ||
      !firstFormData.selectedSubcategory
    ) {
      setError(new Error("All fields are required."));
      return false;
    }

    if (searchType === "text search") {
      if (!textSearchInput.trim()) {
        setError(
          new Error("Text search input cannot be empty or just spaces.")
        );
        return false;
      }
    }

    if (action === "full data" && password.toLowerCase() !== "1235") {
      setError(new Error("Correct password is required to full data."));
      return false;
    }

    setError(null);
    return true;
  }

  function handleButtonClick(action: string) {
    if (validateForm(action)) {
      if (action === "full data") {
        setCentralizeOnce(true); // Set the centralizeOnce flag to true when fetching full data
      }
      setShouldMoveToNextStep(true);
      handleFirstFormApiCall(action);
    }
  }

  function handleFirstFormApiCall(action: string, pageToken?: string) {
    const selectedCity = cities.find(function (city) {
      return city.name === firstFormData.selectedCity;
    });

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
    console.log(
      `Making API call ${callCountRef.current} with pageToken: ${pageToken}`
    );

    const postData = {
      dataset_category: firstFormData.selectedSubcategory,
      dataset_country: firstFormData.selectedCountry,
      dataset_city: firstFormData.selectedCity,
      action: action,
      search_type: searchType,
      ...(searchType === "text search" && {
        text_search_input: textSearchInput.trim(),
      }),
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
      console.log("Post response changed:", postResponse);
      if (
        !postResponse ||
        typeof postResponse !== "object" ||
        !Array.isArray(postResponse.features)
      ) {
        console.error("Invalid GeoJSON object - no data", postResponse);
        setError(new Error("Input data is not a valid GeoJSON object."));
        return;
      }

      setFirstFormResponse((prevResponse) => {
        if (
          prevResponse &&
          typeof prevResponse !== "string" &&
          prevResponse &&
          postResponse
        ) {
          // Merge the features from the new response with the existing ones
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

      // Check if there's a next page token and if we haven't reached the max calls
      if (postResponse.next_page_token && callCountRef.current < MAX_CALLS) {
        console.log(`Next page token found: ${postResponse.next_page_token}`);
        handleFirstFormApiCall("full data", postResponse.next_page_token);
      } else {
        // If no more pages or reached max calls, proceed to the next step
        console.log("No more pages or reached max calls");
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
        <label className={styles.label} htmlFor="searchType">
          Search Type:
        </label>
        <select
          id="searchType"
          name="searchType"
          className={styles.select}
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="old nearby search">Old Nearby Search</option>
          <option value="new nearby search">New Nearby Search</option>
          <option value="nearby but actually text search">
            Nearby But Actually Text Search
          </option>
          <option value="text search">Text Search</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="password">
          Password:
        </label>
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
          <label className={styles.label} htmlFor="textSearchInput">
            Text Search:
          </label>
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
        <label className={styles.label} htmlFor="country">
          Country:
        </label>
        <select
          id="country"
          name="selectedCountry"
          className={styles.select}
          value={firstFormData.selectedCountry}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select a country
          </option>
          {countries.map(function (country) {
            return (
              <option key={country} value={country}>
                {country}
              </option>
            );
          })}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="city">
          City:
        </label>
        <select
          id="city"
          name="selectedCity"
          className={styles.select}
          value={firstFormData.selectedCity}
          onChange={handleChange}
          disabled={!firstFormData.selectedCountry}
        >
          <option value="" disabled>
            Select a city
          </option>
          {cities.map(function (city) {
            return (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="category">
          Category:
        </label>
        <select
          id="category"
          name="selectedCategory"
          className={styles.select}
          value={firstFormData.selectedCategory}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map(function (category) {
            return (
              <option key={category} value={category}>
                {category}
              </option>
            );
          })}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="subcategory">
          Subcategory:
        </label>
        <select
          id="subcategory"
          name="selectedSubcategory"
          className={styles.select}
          value={firstFormData.selectedSubcategory}
          onChange={handleChange}
          disabled={!firstFormData.selectedCategory}
        >
          <option value="" disabled>
            Select a subcategory
          </option>
          {subcategories.map(function (subcategory) {
            return (
              <option key={subcategory} value={subcategory}>
                {formatSubcategoryName(subcategory)}
              </option>
            );
          })}
        </select>
      </div>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.buttonContainer}>
        {localLoading || loading ? (
          <Loader />
        ) : (
          <>
            <button
              className={styles.button}
              onClick={function () {
                handleButtonClick("Get Sample");
              }}
            >
              Get Sample
            </button>
            <button
              className={styles.button}
              onClick={function () {
                handleButtonClick("full data");
              }}
            >
              Full data
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LayerDetailsForm;
