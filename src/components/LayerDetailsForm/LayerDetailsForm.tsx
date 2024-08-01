import React, { useEffect, useState, ChangeEvent } from "react";
import {
  formatSubcategoryName,
  processData,
} from "../../utils/helperFunctions";
import { City } from "../../types/allTypesAndInterfaces";
import styles from "./LayerDetailsForm.module.css";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import urls from "../../urls.json";
import { HttpReq } from "../../services/apiService";

function LayerDetailsForm() {
  const {
    handleNextStep,
    setCentralizeOnce,
    setShowLoaderTopup,
    firstFormData,
    setFirstFormData,
    textSearchInput,
    setTextSearchInput,
    handleFirstFormApiCall,
    searchType,
    setSearchType,
    password,
    setPassword,
  } = useLayerContext();

  const { setGeoPoints } = useCatalogContext();

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
  const [postResMessage, setPostResMessage] = useState<string>("");
  const [postResId, setPostResId] = useState<string>("");

  function fetchData() {
    function handleCountryCityResponse(data: string[]) {
      setCountries(processData(data, setCitiesData));
    }

    function handleCategoriesResponse(data: string[]) {
      setCategories(processData(data, setCategoriesData));
    }

    HttpReq<string[]>(
      urls.country_city,
      handleCountryCityResponse,
      setPostResMessage,
      setPostResId,
      setLocalLoading,
      setError
    );

    HttpReq<string[]>(
      urls.nearby_categories,
      handleCategoriesResponse,
      setPostResMessage,
      setPostResId,
      setLocalLoading,
      setError
    );
  }

  useEffect(function () {
    fetchData();
    setGeoPoints([]);
    setFirstFormData({
      selectedCountry: "",
      selectedCity: "",
      selectedCategory: "",
      selectedSubcategory: "",
    });
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
          selectedCity: "",
        };
      });
    } else if (name === "selectedCategory") {
      const selectedSubcategories = categoriesData[value] || [];
      setSubcategories(selectedSubcategories);
      setFirstFormData(function (prevData) {
        return {
          ...prevData,
          selectedSubcategory: "",
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
        setCentralizeOnce(true);
      }
      setShowLoaderTopup(true);
      handleNextStep();
      handleFirstFormApiCall(action);
    }
  }

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
          onChange={function (e) {
            setSearchType(e.target.value);
          }}
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
          onChange={function (e) {
            setPassword(e.target.value);
          }}
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
            onChange={function (e) {
              setTextSearchInput(e.target.value);
            }}
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
      </div>
    </div>
  );
}

export default LayerDetailsForm;
