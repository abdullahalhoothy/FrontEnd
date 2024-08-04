// src/components/ErrorIconFeedback/ErrorIconFeedback.tsx

import React from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import styles from "./ErrorIconFeedback.module.css";

// Component to display error feedback
function ErrorIconFeedback() {
  return (
    <div className={styles.errorMessage}>
      <MdOutlineErrorOutline className={styles.errorIcon} />
      <p>Failed. Please relogin and try again.</p>
    </div>
  );
}

export default ErrorIconFeedback;
