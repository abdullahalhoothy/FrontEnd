import React from "react";
import { MdCheckCircleOutline } from "react-icons/md";
import styles from "./SavedIconFeedback.module.css";

function SavedIconFeedback() {
  return (
    <div className={styles.successMessage}>
      <MdCheckCircleOutline className={styles.successIcon} />
      <p>Saved successfully!</p>
    </div>
  );
}

export default SavedIconFeedback;
