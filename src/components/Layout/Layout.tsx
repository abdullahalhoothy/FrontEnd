// src/components/Layout/Layout.tsx

import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { MdInfo, MdMap, MdTableChart, MdPerson, MdExitToApp } from "react-icons/md";
import { FaLayerGroup, FaBoxOpen } from "react-icons/fa";
import styles from "./Layout.module.css";
import ExpandableMenu from "../ExpandableMenu/ExpandableMenu";
import Home from "../../pages/Home/Home";
import Dataview from "../../pages/Dataview/Dataview";
import Auth from "../Auth/Auth";
import Profile from "../Profile/Profile";
import AuthRoute from "../Auth/AuthRoute";
import { useUIContext } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import CatalogSideMenu from "../CatalogSideMenu/CatalogSideMenu";
import CatalogDetailsForm from "../CatalogDetailsForm/CatalogDetailsForm";
import CreateLayer from "../CreateLayer/CreateLayer";

function Layout() {
  const { 
    sidebarMode, 
    isMenuExpanded, 
    isViewClicked, 
    handleViewClick, 
    setSidebarMode, 
    openModal
  } = useUIContext();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function openLayerModal() {
    openModal(<CreateLayer />, { isSmaller: true });
  }

  function handleMapClick() {
    handleViewClick();
    navigate('/');
  }

  function handleOpenLayerModal() {
    openLayerModal();
  }

  function handleSetSidebarMode() {
    setSidebarMode("catalog");
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuContent = (
    <ul className={styles.menuList}>
      <li>
        <div
          onClick={handleMapClick}
          className={styles.iconContainer}
        >
          <MdMap className={styles.icon} />
          {isMenuExpanded && <span> Map</span>}
        </div>
      </li>
      {isViewClicked && (
        <>
          <li>
            <div
              onClick={handleOpenLayerModal}
              className={styles.iconContainer}
            >
              <FaLayerGroup className={styles.icon} />
              {isMenuExpanded && <span> Create Layer</span>}
            </div>
          </li>
          <li>
            <div
              onClick={handleSetSidebarMode}
              className={styles.iconContainer}
            >
              <FaBoxOpen className={styles.icon} />
              {isMenuExpanded && <span> Create Catalog</span>}
            </div>
          </li>
        </>
      )}
      <li>
        <Link to="/tabularView">
          <MdTableChart className={styles.icon} />
          {isMenuExpanded && <span> Tabular View</span>}
        </Link>
      </li>
      <li>
        <Link to="https://northernacs.com/">
          <MdInfo className={styles.icon} />
          {isMenuExpanded && <span> About Us</span>}
        </Link>
      </li>
      {isAuthenticated ? (
        <>
          <li>
            <Link to="/profile">
              <MdPerson className={styles.icon} />
              {isMenuExpanded && <span> Profile</span>}
            </Link>
          </li>
          <li>
            <div onClick={handleLogout} className={styles.iconContainer}>
              <MdExitToApp className={styles.icon} />
              {isMenuExpanded && <span> Logout</span>}
            </div>
          </li>
        </>
      ) : (
        <li>
          <Link to="/auth">
            <MdPerson className={styles.icon} />
            {isMenuExpanded && <span> Login/Register</span>}
          </Link>
        </li>
      )}
    </ul>
  );

  const sidebarContent =
    sidebarMode === "default" ? (
      <ExpandableMenu>
        {menuContent}
      </ExpandableMenu>
    ) : sidebarMode === "catalog" ? (
      <div className={styles.CreateCatalogMenu}>
        <CatalogSideMenu />
      </div>
    ) : sidebarMode === "catalogDetails" ? (
      <div className={styles.CreateCatalogMenu}>
        <CatalogDetailsForm />
      </div>
    ) : null;

  return (
    <div className={styles.layout}>
      {sidebarContent}
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tabularView" element={<Dataview />} />
          {/* redirect to "https://northernacs.com" */}
          <Route path="/auth" element={<Auth />} />
          <Route element={<AuthRoute />}>
            <Route path="/profile" element={<Profile />} />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default Layout;