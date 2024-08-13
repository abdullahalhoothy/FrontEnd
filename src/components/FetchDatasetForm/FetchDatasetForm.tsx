import { useCatalogContext } from "../../context/CatalogContext";
import React, { useState, useEffect } from "react";
import { formatSubcategoryName } from "../../utils/helperFunctions";
import styles from "./FetchDatasetForm.module.css";
import { useLayerContext } from "../../context/LayerContext";

function FetchDatasetForm() {
  const {
    countries,
    cities,
    categories,
    reqFetchDataset,
    setReqFetchDataset,
    incrementFormStage,
    setCentralizeOnce,
    setShowLoaderTopup,
    textSearchInput,
    setTextSearchInput,
    handleFetchDataset,
    searchType,
    setSearchType,
    password,
    setPassword,
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

  const { setGeoPoints } = useCatalogContext();

  const [error, setError] = useState<Error | null>(null);

  function handleButtonClick(
    action: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();

    const result = validateFetchDatasetForm()

    if (result === true) {
      if (action === "full data") {
        setCentralizeOnce(true);
      }
      setShowLoaderTopup(true);
      incrementFormStage();
      handleFetchDataset(action);
    }
    else if(result instanceof Error){
      setError(result);
      return false
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
          onChange={(e) => setSearchType(e.target.value)}
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
                {(types as string[]).map((type: string) => {
                  const included = reqFetchDataset.includedTypes.includes(type);
                  const excluded = reqFetchDataset.excludedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.typeButton} ${included
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
      {error && <p className={styles.error}>{error.message}</p>}

      <div className={styles.buttonContainer}>
        <button
          type="button"
          onClick={(e) => handleButtonClick("sample", e)}
        >
          Get Sample
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={(e) => handleButtonClick("full data", e)}
        >
          Full data
        </button>
      </div>
    </form>
  );
}

export default FetchDatasetForm;