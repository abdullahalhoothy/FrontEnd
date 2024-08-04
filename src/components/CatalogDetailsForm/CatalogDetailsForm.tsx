// src/components/CatalogDetailsForm/CatalogDetailsForm.tsx

import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./CatalogDetailsForm.module.css";
import SaveOptions from "../SaveOptions/SaveOptions";
import Loader from "../Loader/Loader";
import { useCatalogContext } from "../../context/CatalogContext";
import { useUIContext } from "../../context/UIContext";
import SavedIconFeedback from "../SavedIconFeedback/SavedIconFeedback";
import ErrorIconFeedback from "../ErrorIconFeedback/ErrorIconFeedback";

function CatalogDetailsForm() {
  const { openModal, setSidebarMode } = useUIContext();
  const {
    legendList,
    subscriptionPrice,
    description,
    name,
    setDescription,
    setName,
    setSubscriptionPrice,
    isLoading,
    saveResponse,
    isError,
    resetState,
  } = useCatalogContext();

  const [error, setError] = useState<string | null>(null);

  // This effect runs whenever isLoading, saveResponse, or isError changes.
  useEffect(
    function () {
      if (isLoading || saveResponse || isError) {
        openModal(renderModalContent(), {
          isSmaller: true,
          darkBackground: true,
        });
      }
    },
    [isLoading, saveResponse, isError]
  );

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
      openModal(<SaveOptions />, {
        isSmaller: true,
        darkBackground: true,
      });
    }
  }

  function renderModalContent() {
    if (isLoading) {
      return <Loader />;
    }

    if (saveResponse) {
      return <SavedIconFeedback />;
    }

    if (isError) {
      return <ErrorIconFeedback />;
    }
  }

  function handleDiscardClick() {
    resetState();
    setName("");
    setDescription("");
    setSubscriptionPrice("");
    setSidebarMode("default");
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
    <div className={styles.container}>
      <h1>Create Catalog</h1>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="legendlist">
          Legend List
        </label>
        <textarea
          id="legendlist"
          className={`${styles.select} ${styles.textArea}`}
          value={
            legendList.length > 0
              ? legendList.join("\n")
              : "No legends at the selected layers"
          }
          readOnly
        ></textarea>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="subprice">
          Subscription Price
        </label>
        <input
          type="text"
          id="subprice"
          className={styles.select}
          value={subscriptionPrice}
          onChange={handleChange}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          type="text"
          id="name"
          className={styles.select}
          value={name}
          onChange={handleChange}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={`${styles.select} ${styles.textArea}`}
          value={description}
          onChange={handleChange}
        ></textarea>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttonContainer}>
        <button
          className={`${styles.button} ${styles.discardButton}`}
          onClick={handleDiscardClick}
        >
          Discard
        </button>
        <button
          className={`${styles.button} ${styles.saveButton}`}
          onClick={handleButtonClick}
        >
          Save Catalog
        </button>
      </div>
    </div>
  );
}

export default CatalogDetailsForm;
