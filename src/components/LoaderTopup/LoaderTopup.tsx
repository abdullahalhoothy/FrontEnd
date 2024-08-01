import React from "react";
import styles from "./LoaderTopup.module.css";

function LoaderTopup() {
  return (
    <div className={styles.topupContainer}>
      <div className={styles.loaderWrapper}>
        <div className={styles.loadingText}>Loading More Data...</div>
      </div>
    </div>
  );
}

export default LoaderTopup;
