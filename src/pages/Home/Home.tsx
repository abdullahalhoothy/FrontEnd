import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";
import MapContainer from "../../components/MapContainer/MapContainer";
import DataContainer from "../../components/DataContainer/DataContainer";
import { useUIContext } from "../../context/UIContext";

function HomeComponent() {
  const { openModal } = useUIContext();
  const [hasOpened, setHasOpened] = useState(false);

  // useEffect is used to open the modal only once when the component mounts.
  // The effect checks if the modal has already been opened using the `hasOpened` state.
  // If not, it opens the modal with the `DataContainer` component as content and sets `hasOpened` to true.
  // This ensures the modal opens only once and doesn't reopen on subsequent renders.

  useEffect(
    function () {
      if (!hasOpened) {
        openModal(<DataContainer />, {
          darkBackground: true,
        });
        setHasOpened(true);
      }
    },
    [hasOpened, openModal]
  );

  return (
    <div className={styles.content}>
      <MapContainer />
    </div>
  );
}

export default HomeComponent;
