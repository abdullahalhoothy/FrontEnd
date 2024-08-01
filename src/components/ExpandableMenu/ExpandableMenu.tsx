import React, { ReactNode } from "react";
import styles from "./ExpandableMenu.module.css";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { useUIContext } from "../../context/UIContext";
import { ExpandableMenuProps } from "../../types/allTypesAndInterfaces";

function ExpandableMenu({ children }: ExpandableMenuProps) {
  const { isMenuExpanded, toggleMenu } = useUIContext();

  return (
    <div className={`${styles.menu} ${isMenuExpanded ? styles.expanded : ""}`}>
      <button onClick={toggleMenu} className={styles.toggleButton}>
        {isMenuExpanded ? (
          <MdExpandLess className={styles.icon} />
        ) : (
          <MdExpandMore className={styles.icon} />
        )}
      </button>
      <div className={styles.menuItems}>{children}</div>
    </div>
  );
}

export default ExpandableMenu;
