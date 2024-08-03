// src/components/CheckExtensions.tsx

import React, { useEffect, useState } from 'react';
import { MdOutlineErrorOutline } from "react-icons/md";
import detectBlockedByClient from "../../utils/ErrorDetector";
import styles from "./CheckExtensions.module.css";  // You'll need to create this CSS module

const CheckExtensions: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    detectBlockedByClient((isBlocked) => {
      if (isBlocked) {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 6000);
      }
    });
  }, []);

  if (!showPopup) return null;

  return (
    <div className={styles.popupContainer}>
      <MdOutlineErrorOutline style={{ color: "red", marginRight: "8px" }} />
      <span>
        It looks like an ad blocker is causing some issues. Please
        disable it for the best experience.
      </span>
    </div>
  );
};

export default CheckExtensions;