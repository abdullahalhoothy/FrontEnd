// src/components/CostEstimatorForm/CostEstimatorForm.tsx
import React, { useState } from "react";
import { formatSubcategoryName } from "../../utils/helperFunctions";
import styles from "./CostEstimatorForm.module.css";
import { useLayerContext } from "../../context/LayerContext";
import { HttpReq } from "../../services/apiService";
import urls from "../../urls.json";
import { CostEstimate } from '../../types/allTypesAndInterfaces';
import { useLocationAndCategories } from '../../hooks/useLocationAndCategories';

function CostEstimatorForm() {
  const {
    countries,
    cities,
    categories,
    firstFormData,
    isError,
    setIsError
  } = useLayerContext();
  
  const { 
    handleChange,
    handleTypeToggle,
    validateForm } = useLocationAndCategories() 

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleCostEstimate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validateForm("estimate")) {
      setIsLoading(true);
      const requestBody = {
        included_categories: firstFormData.includedTypes,
        excluded_categories: firstFormData.excludedTypes,
        city_name: firstFormData.selectedCity,
        country: firstFormData.selectedCountry,
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
          value={firstFormData.selectedCountry}
          onChange={handleChange}
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
          value={firstFormData.selectedCity}
          onChange={handleChange}
          disabled={!firstFormData.selectedCountry}
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
                  const included = firstFormData.includedTypes.includes(type);
                  const excluded = firstFormData.excludedTypes.includes(type);
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