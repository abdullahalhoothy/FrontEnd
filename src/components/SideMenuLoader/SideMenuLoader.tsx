// src/components/SideMenuLoader/SideMenuLoader.tsx

import React from "react";
import { useUIContext } from "../../context/UIContext";
import DefaultSideMenu from "../DefaultSideMenu/DefaultSideMenu";
import CatalogSideMenu from "../CatalogSideMenu/CatalogSideMenu";
import CatalogDetailsForm from "../CatalogDetailsForm/CatalogDetailsForm";
import styles from "./SideMenuLoader.module.css";

const SideMenuLoader: React.FC = () => {
  const { sidebarMode } = useUIContext();

  return (
    <div className={styles.sideMenuLoader}>
      {sidebarMode === "default" && <DefaultSideMenu />}
      {sidebarMode === "catalog" && <CatalogSideMenu />}
      {sidebarMode === "catalogDetails" && <CatalogDetailsForm />}
    </div>
  );
};

export default SideMenuLoader;