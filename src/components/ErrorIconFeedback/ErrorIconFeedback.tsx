import React from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import styles from "./ErrorIconFeedback.module.css";

// Component to display error feedback
function ErrorIconFeedback() {
  return (
    <div className={styles.errorMessage}>
      <MdOutlineErrorOutline className={styles.errorIcon} />
      <p>Failed to save. Please try again later.</p>
    </div>
  );
}

export default ErrorIconFeedback;
