import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Layout from "./components/Layout/VertiSideBar";
import { CatalogProvider } from "./context/CatalogContext";
import { LayerProvider } from "./context/LayerContext";
import { UIProvider } from "./context/UIContext";
import detectBlockedByClient from "./utils/ErrorDetector";
import { MdOutlineErrorOutline } from "react-icons/md";
import styles from "./App.module.css";

const App: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(function () {
    detectBlockedByClient(function (isBlocked) {
      if (isBlocked) {
        setShowPopup(true);
        setTimeout(function () {
          setShowPopup(false);
        }, 6000);
      }
    });
  }, []);

  return (
    <Router>
      <CatalogProvider>
        <LayerProvider>
          <UIProvider>
            <Layout />
            {showPopup && (
              <div className={styles.topupContainer}>
                <MdOutlineErrorOutline
                  style={{ color: "red", marginRight: "8px" }}
                />
                <span>
                  It looks like an ad blocker is causing some issues. Please
                  disable it for the best experience.
                </span>
              </div>
            )}
          </UIProvider>
        </LayerProvider>
      </CatalogProvider>
    </Router>
  );
};

export default App;
