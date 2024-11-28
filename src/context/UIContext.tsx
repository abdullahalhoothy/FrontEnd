import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useLayoutEffect,
} from "react";
import Modal from "../components/Modal/Modal";
import { useCatalogContext } from "./CatalogContext";
import { useLayerContext } from "./LayerContext";
import { ModalOptions, UIContextProps } from "../types/allTypesAndInterfaces";
import { useLocation } from "react-router";

const UIContext = createContext<UIContextProps | undefined>(undefined);

// Hook to use the UIContext
export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIContext must be used within a UIProvider");
  }
  return context;
}

// UIProvider component to provide UI state and actions
export function UIProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});
  const [sidebarMode, setSidebarModeState] = useState("default");
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [isViewClicked, setIsViewClicked] = useState(false);
  const location = useLocation();
  // Use CatalogContext and LayerContext to manage their respective states
  const {
    saveResponse: catalogIsSaved,
    isError: catalogIsError,
    setSaveResponse: setCatalogIsSaved,
    setIsError: setCatalogIsError,
    resetFormStage,
    resetState,
  } = useCatalogContext();

  const {
    saveResponse: layerIsSaved,
    isError: layerIsError,
    setSaveResponse: setLayerIsSaved,
    setIsError: setLayerIsError,
    setFormStage,
    setCentralizeOnce,
    setInitialFlyToDone,
  } = useLayerContext();

  // Function to open the modal with specified content and options
  function openModal(content: ReactNode, options: ModalOptions = {}) {
    setModalContent(content);
    setModalOptions(options);
    setIsModalOpen(true);
  }

  // Function to close the modal and reset related states
  function closeModal() {
    setIsModalOpen(false);
    setModalContent(null);
    setModalOptions({});
    setFormStage("initial");
    setCentralizeOnce(false);
    setInitialFlyToDone(false);

    // Reset CatalogContext states if applicable
    if (catalogIsSaved || catalogIsError) {
      setCatalogIsSaved(null);
      resetFormStage("catalogue");
      resetState();
    }

    // Reset LayerContext states if applicable
    if (layerIsSaved) {
      setLayerIsSaved(null);
    }
    if (layerIsError) {
      setLayerIsError(null);
    }
  }

  // Function to reset the view state
  function resetViewState() {
    setIsViewClicked(false);
  }

  // Function to toggle the menu expansion state
  function toggleMenu() {
    setIsMenuExpanded(!isMenuExpanded);
  }

  // Function to handle view clicks
  function handleViewClick() {
    setIsViewClicked(!isViewClicked);
  }

  // Function to set the sidebar mode
  function setSidebarMode(mode: string) {
    setSidebarModeState(mode);
  }

  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsMobile(true);
        if (location.pathname !== "/profile") {
          setIsDrawerOpen(true);
        }
      } else {
        setIsMobile(false);
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <UIContext.Provider
      value={{
        isModalOpen,
        modalContent,
        modalOptions,
        sidebarMode,
        isMenuExpanded,
        isViewClicked,
        openModal,
        closeModal,
        toggleMenu,
        handleViewClick,
        setSidebarMode,
        resetViewState,
        isMobile,
        setIsMobile,
        isDrawerOpen, setIsDrawerOpen
      }}
    >
      {children}
      {isModalOpen && <Modal {...modalOptions}>{modalContent}</Modal>}
    </UIContext.Provider>
  );
}
