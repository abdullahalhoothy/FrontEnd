// src/pages/Home/Home.tsx
import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";
import MapContainer from "../../components/MapContainer/MapContainer";
import DataContainer from "../../components/DataContainer/DataContainer";
import { useUIContext } from "../../context/UIContext";

function HomeComponent() {
  const { openModal } = useUIContext();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (!hasOpened) {
      openModal(<DataContainer />, {
        darkBackground: true,
      });
      setHasOpened(true);
    }
  }, [hasOpened, openModal]);

  return (
    <div className={styles.container}>
      <div className={styles.mapContent}>
        <MapContainer />
      </div>
    </div>
  );
}

export default HomeComponent;