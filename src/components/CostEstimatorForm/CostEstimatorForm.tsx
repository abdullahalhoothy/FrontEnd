// src/components/CostEstimatorForm/CostEstimatorForm.tsx
import React, { useState, useEffect } from "react";
import { formatSubcategoryName } from "../../utils/helperFunctions";
import styles from "./CostEstimatorForm.module.css";
import { useLayerContext } from "../../context/LayerContext";
import { HttpReq } from "../../services/apiService";
import urls from "../../urls.json";
import { CostEstimate } from '../../types/allTypesAndInterfaces';


function CostEstimatorForm() {
  const {
    countries,
    cities,
    categories,
    reqFetchDataset,
    isError,
    setIsError,
    handleCountryCitySelection,
    handleTypeToggle,
    validateFetchDatasetForm,
    resetFetchDatasetForm
  } = useLayerContext();
  
    // when form first loads, reset previous form data setReqFetchDataset()to its initial state
    // The empty dependency array [] at the end of the useEffect hook means this effect will 
    // only run once, after the initial render, and when the component unmounts.
    useEffect(() => {
      return resetFetchDatasetForm
    }, []);

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleCostEstimate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validateFetchDatasetForm()) {
      setIsLoading(true);
      const requestBody = {
        included_categories: reqFetchDataset.includedTypes,
        excluded_categories: reqFetchDataset.excludedTypes,
        city_name: reqFetchDataset.selectedCity,
        country: reqFetchDataset.selectedCountry,
      };

      HttpReq<CostEstimate>(
        urls.cost_calculator,
        (data) => {
          if (data && typeof data.cost === 'number' && typeof data.api_calls === 'number') {
            setCostEstimate(data);
          } else {
            setIsError(new Error('Invalid response from server'));
          }
        },
        () => {},
        () => {},
        () => setIsLoading(false),
        setIsError,
        "post",
        requestBody
      );
    }
  }

  return (
    <form className={styles.container} onSubmit={handleCostEstimate}>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="country">
          Country:
        </label>
        <select
          id="country"
          name="selectedCountry"
          className={styles.select}
          value={reqFetchDataset.selectedCountry}
          onChange={handleCountryCitySelection}
        >
          <option value="" disabled>
            Select a country
          </option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
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
          value={reqFetchDataset.selectedCity}
          onChange={handleCountryCitySelection}
          disabled={!reqFetchDataset.selectedCountry}
        >
          <option value="" disabled>
            Select a city
          </option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
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
                {types.map((type) => {
                  const included = reqFetchDataset.includedTypes.includes(type);
                  const excluded = reqFetchDataset.excludedTypes.includes(type);
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
                      onClick={(e) => {
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
          ))}
        </div>
      </div>

      {isError && <p className={styles.error}>{isError.message}</p>}

      <div className={styles.buttonContainer}>
      <button type="submit" className={styles.button} disabled={isLoading}>
        {isLoading ? "Estimating..." : "Estimate Cost"}
      </button>
    </div>

    {costEstimate && (
      <div className={styles.costEstimate}>
        <h3>Cost Estimate</h3>
        <p>Estimated Cost: ${costEstimate.cost?.toFixed(2) ?? 'N/A'}</p>
        <p>API Calls: {costEstimate.api_calls ?? 'N/A'}</p>
      </div>
    )}

    {isError && <p className={styles.error}>{isError.message}</p>}
  </form>
);
}

export default CostEstimatorForm;