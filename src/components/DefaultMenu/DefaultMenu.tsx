import { Link } from "react-router-dom";
import { MdInfo, MdMap, MdTableChart, MdFactory } from "react-icons/md";
import { FaLayerGroup, FaBoxOpen } from "react-icons/fa";
import styles from "./DefaultMenu.module.css";
import CreateLayer from "../CreateLayer/CreateLayer";
import { useUIContext } from "../../context/UIContext";

function DefaultMenu() {
  const {
    isMenuExpanded,
    isViewClicked,
    handleViewClick,
    setSidebarMode,
    openModal,
  } = useUIContext();

  function openLayerModal() {
    openModal(<CreateLayer />, { isSmaller: true });
  }

  function handleViewClickContainer() {
    handleViewClick();
  }

  function handleOpenLayerModal() {
    openLayerModal();
  }

  function handleSetSidebarMode() {
    setSidebarMode("catalog");
  }

  return (
    <ul className={styles.menuList}>
      <li>
        <Link to="/">
          <MdMap className={styles.icon} />
          {isMenuExpanded && <span> Home</span>}
        </Link>
      </li>
      <li>
        <Link to="/tabularView">
          <MdTableChart className={styles.icon} />
          {isMenuExpanded && <span> Tabular View</span>}
        </Link>
      </li>
      <li>
        <Link to="/about">
          <MdInfo className={styles.icon} />
          {isMenuExpanded && <span> About</span>}
        </Link>
      </li>
      <li>
        <div
          onClick={handleViewClickContainer}
          className={styles.iconContainer}
        >
          <MdFactory className={styles.icon} />
          {isMenuExpanded && <span> View</span>}
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
    </ul>
  );
}

export default DefaultMenu;
