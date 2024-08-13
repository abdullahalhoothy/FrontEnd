// src/components/DefaultSideMenu/DefaultSideMenu.tsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdInfo, MdMap, MdTableChart, MdPerson, MdExitToApp, MdAttachMoney, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaLayerGroup, FaBoxOpen } from "react-icons/fa";
import styles from "./DefaultSideMenu.module.css";
import { useUIContext } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import FormLoader from "../FormLoader/FormLoader";
import InternalCostEstimate from "../CostEstimatorForm/CostEstimatorForm";

const DefaultSideMenu: React.FC = () => {
  const { 
    isMenuExpanded, 
    isViewClicked, 
    handleViewClick, 
    setSidebarMode, 
    openModal,
    toggleMenu
  } = useUIContext();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleMapClick = () => {
    handleViewClick();
    navigate('/');
  };

  const handleOpenLayerModal = () => {
    openModal(<FormLoader />, { isSmaller: true });
  };

  const handleSetSidebarMode = () => {
    setSidebarMode("catalog");
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openCostEstimateModal = () => {
    openModal(<InternalCostEstimate />, { isSmaller: true });
  };

  return (
    <div className={`${styles.menu} ${isMenuExpanded ? styles.expanded : ""}`}>
      <button onClick={toggleMenu} className={styles.toggleButton}>
        {isMenuExpanded ? (
          <MdExpandLess className={styles.icon} />
        ) : (
          <MdExpandMore className={styles.icon} />
        )}
      </button>
      <div className={styles.menuItems}>
        <ul className={styles.menuList}>
          <li>
            <div onClick={handleMapClick} className={styles.iconContainer}>
              <MdMap className={styles.icon} />
              {isMenuExpanded && <span> Map</span>}
            </div>
          </li>
          {isViewClicked && (
            <>
              <li>
                <div onClick={handleOpenLayerModal} className={styles.iconContainer}>
                  <FaLayerGroup className={styles.icon} />
                  {isMenuExpanded && <span> Locate</span>}
                </div>
              </li>
              <li>
                <div onClick={handleSetSidebarMode} className={styles.iconContainer}>
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
          <li>
            <div onClick={openCostEstimateModal} className={styles.iconContainer}>
              <MdAttachMoney className={styles.icon} />
              {isMenuExpanded && <span> Internal Cost Estimate</span>}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DefaultSideMenu;