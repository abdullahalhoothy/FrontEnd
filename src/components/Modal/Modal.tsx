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
      id={'overlay'}
      className={`${styles.modalOverlay} ${darkBackground ? styles.darkBackground : ""
        } ${isSmaller ? styles.pointerEventsNone : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target.id) closeModal();
      }}
    >
      <div
        className={`${styles.modalContent} rounded-lg border shadow overflow-y-auto ${isSmaller ? styles.smallerContainer : ""
          } ${styles.pointerEventsAll}`}
      >
        <button
          className='transition-all text-xl w-10 h-10 hover:text-white font-bold hover:bg-red-600 absolute top-0 right-0 rounded-tr-lg'
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
