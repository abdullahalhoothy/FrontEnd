import React, { useEffect, useState, ChangeEvent } from "react";
import {
  formatSubcategoryName,
  processCityData,
} from "../../utils/helperFunctions";
import { City } from "../../types/allTypesAndInterfaces";
import styles from "./LayerDetailsForm.module.css";
import { useLayerContext } from "../../context/LayerContext";
import { useCatalogContext } from "../../context/CatalogContext";
import urls from "../../urls.json";
import { HttpReq } from "../../services/apiService";

export interface CategoryData {
  [category: string]: string[];
}

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
  const [categories, setCategories] = useState<CategoryData>({});
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
      setCountries(processCityData(data, setCitiesData));
    }

    HttpReq<string[]>(
      urls.country_city,
      handleCountryCityResponse,
      setPostResMessage,
      setPostResId,
      setLocalLoading,
      setError
    );

    HttpReq<CategoryData>(
      urls.nearby_categories,
      setCategories,
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
      includedTypes: [],
      excludedTypes: [],
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
    }
  }

  function handleTypeToggle(type: string) {
    setFirstFormData(function (prevData) {
      if (prevData.includedTypes.includes(type)) {
        // If currently included, move to excluded
        return {
          ...prevData,
          includedTypes: prevData.includedTypes.filter(function (t) {
            return t !== type;
          }),
          excludedTypes: [...prevData.excludedTypes, type],
        };
      } else if (prevData.excludedTypes.includes(type)) {
        // If currently excluded, move to not selected
        return {
          ...prevData,
          excludedTypes: prevData.excludedTypes.filter(function (t) {
            return t !== type;
          }),
        };
      } else {
        // If not selected, move to included
        return {
          ...prevData,
          includedTypes: [...prevData.includedTypes, type],
        };
      }
    });
  }

  function validateForm(action: string) {
    if (!firstFormData.selectedCountry || !firstFormData.selectedCity) {
      setError(new Error("Country and city are required."));
      return false;
    }

    if (
      firstFormData.includedTypes.length === 0 &&
      firstFormData.excludedTypes.length === 0
    ) {
      setError(
        new Error("At least one category must be included or excluded.")
      );
      return false;
    }

    if (
      firstFormData.includedTypes.length > 50 ||
      firstFormData.excludedTypes.length > 50
    ) {
      setError(
        new Error(
          "Up to 50 types can be specified in each type restriction category."
        )
      );
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

  function handleButtonClick(
    action: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault(); 

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
    <form className={styles.container}>
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
          <option value="new nearby search">New Nearby Search</option>
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
          className={styles.select}
          value={password}
          autoComplete="new-password"
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
        <label className={styles.label}>What are you looking for?</label>
        <div className={styles.categoryContainer}>
          {Object.entries(categories).map(function (entry) {
            var category = entry[0];
            var types = entry[1];
            return (
              <div key={category} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <div className={styles.typeList}>
                  {types.map(function (type) {
                    var included = firstFormData.includedTypes.includes(type);
                    var excluded = firstFormData.excludedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`${styles.typeButton} ${
                          included
                            ? styles.included
                            : excluded
                            ? styles.excluded
                            : ""
                        }`}
                        onClick={function (e) {
                          e.preventDefault();
                          handleTypeToggle(type);
                        }}
                      >
                        {formatSubcategoryName(type)}
                        <span className={styles.toggleIcon}>
                          {included ? "✓" : excluded ? "−" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {error && <p className={styles.error}>{error.message}</p>}

      <div className={styles.buttonContainer}>
        <>
          <button
            type="button"
            onClick={function (e) {
              handleButtonClick("sample", e);
            }}
          >
            Get Sample
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={function (e) {
              handleButtonClick("full data", e);
            }}
          >
            Full data
          </button>
        </>
      </div>
    </form>
  );
}

export default LayerDetailsForm;
