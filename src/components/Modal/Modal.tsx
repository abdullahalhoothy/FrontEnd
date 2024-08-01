import React from "react";
import ReactDOM from "react-dom";
import styles from "./Modal.module.css";
import { ModalProps } from "../../types/allTypesAndInterfaces";
import { useUIContext } from "../../context/UIContext";

function Modal(props: ModalProps) {
  const { children, darkBackground = false, isSmaller = false } = props;
  const { closeModal, isModalOpen } = useUIContext();

  if (!isModalOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      className={`${styles.modalOverlay} ${
        darkBackground ? styles.darkBackground : ""
      } ${isSmaller ? styles.pointerEventsNone : ""}`}
    >
      <div
        className={`${styles.modalContent} ${
          isSmaller ? styles.smallerContainer : ""
        } ${styles.pointerEventsAll}`}
      >
        <button
          className={styles.closeButton}
          onClick={closeModal}
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
