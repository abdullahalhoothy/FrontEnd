import React, { useState, useEffect, useMemo } from "react";
import CatalogueCard from "../CatalogueCard/CatalogueCard";
import styles from "./DataContainer.module.css";
import { HttpReq } from "../../services/apiService";
import urls from "../../urls.json";
import {
  Catalog,
  UserLayer,
  CardItem,
} from "../../types/allTypesAndInterfaces";
import { useCatalogContext } from "../../context/CatalogContext";
import { useUIContext } from "../../context/UIContext";
import { MapFeatures } from "../../types/allTypesAndInterfaces";
import UserLayerCard from "../UserLayerCard/UserLayerCard";
import userIdData from "../../currentUserId.json";
import { isValidColor, colorOptions } from "../../utils/helperFunctions";

function DataContainer() {
  const {
    selectedContainerType,
    handleAddClick,
    setGeoPoints,
    selectedLayers,
  } = useCatalogContext();
  const { closeModal } = useUIContext();
  const [activeTab, setActiveTab] = useState("Data Catalogue");
  const [resData, setResData] = useState<(Catalog | UserLayer)[] | string>("");
  const [userLayersData, setUserLayersData] = useState<UserLayer[]>([]);
  const [catalogCollectionData, setCatalogCollectionData] = useState<Catalog[]>(
    []
  );
  const [userCatalogsData, setUserCatalogsData] = useState<Catalog[]>([]);
  const [resMessage, setResMessage] = useState<string>("");
  const [resId, setResId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [wsResMessage, setWsResMessage] = useState<string>("");
  const [wsResId, setWsResId] = useState<string>("");
  const [wsResloading, setWsResLoading] = useState<boolean>(true);
  const [wsReserror, setWsResError] = useState<Error | null>(null);

  useEffect(
    function () {
      var isMounted = true; // Flag to ensure we don't update state on an unmounted component

      // Fetch user layers data
      function fetchUserLayers() {
        var body = { user_id: userIdData.user_id };
        HttpReq<UserLayer[]>(
          urls.user_layers,
          function (response) {
            if (isMounted) setUserLayersData(response);
          },
          setResMessage,
          setResId,
          setLoading,
          setError,
          "post",
          body
        );
      }

      // Fetch catalog collection data
      function fetchCatalogCollection() {
        HttpReq<Catalog[]>(
          urls.catlog_collection,
          function (response) {
            if (isMounted) setCatalogCollectionData(response);
          },
          setResMessage,
          setResId,
          setLoading,
          setError
        );
      }


      // Fetch user catalogs data
      function fetchUserCatalogs() {
        var body = { user_id: userIdData.user_id };
        HttpReq<Catalog[]>(
          urls.user_catalogs,
          function (response) {
            if (isMounted) setUserCatalogsData(response);
          },
          setResMessage,
          setResId,
          setLoading,
          setError,
          "post",
          body
        );
      }

      // Determine which data to fetch based on selected container type
      function fetchData() {
        setLoading(true);
        setError(null);

        if (selectedContainerType === "Layer") {
          fetchUserLayers();
        } else if (selectedContainerType === "Catalogue") {
          fetchCatalogCollection();
          fetchUserCatalogs();
        } else if (selectedContainerType === "Home") {
          fetchCatalogCollection();
        }

        setLoading(false);
      }

      fetchData();

      return function () {
        isMounted = false; // Cleanup function to avoid setting state on unmounted component
      };
    },
    [selectedContainerType]
  );

  useEffect(
    function () {
      // Combine catalog and user layers data based on selected container type
      if (selectedContainerType === "Catalogue") {
        var combinedData = catalogCollectionData.concat(userCatalogsData);
        if (JSON.stringify(resData) !== JSON.stringify(combinedData)) {
          setResData(combinedData);
        }
      } else if (selectedContainerType === "Layer") {
        if (JSON.stringify(resData) !== JSON.stringify(userLayersData)) {
          setResData(userLayersData);
        }
      } else if (selectedContainerType === "Home") {
        if (JSON.stringify(resData) !== JSON.stringify(catalogCollectionData)) {
          setResData(catalogCollectionData);
        }
      }
    },
    [
      userLayersData,
      catalogCollectionData,
      userCatalogsData,
      selectedContainerType,
    ]
  );

  // Filter out already selected layers from the data to be displayed
  const filteredData = useMemo(
    function () {
      if (Array.isArray(resData)) {
        return resData.filter(function (item) {
          return !selectedLayers.some(function (layer) {
            return (
              (item as Catalog).id === layer.id ||
              (item as UserLayer).prdcer_lyr_id === layer.id
            );
          });
        });
      }
      return resData;
    },
    [resData, selectedLayers]
  );

  // Handle click event on catalog card
  function handleCatalogCardClick(selectedItem: CardItem) {
    if (selectedContainerType === "Home") {
      HttpReq<MapFeatures>(
        urls.http_catlog_data,
        setGeoPoints,
        setWsResMessage,
        setWsResId,
        setWsResLoading,
        setWsResError,
        "post",
        { catalogue_dataset_id: selectedItem.id }
      );
    }

    if (selectedContainerType !== "Home") {
      handleAddClick(
        selectedItem.id,
        selectedItem.name,
        selectedItem.typeOfCard,
        selectedItem.points_color,
        selectedItem.legend,
        selectedItem.lyrs
      );
    }

    closeModal();
  }


  // Render a card based on the item type
  function makeCard(item: Catalog | UserLayer) {
    if ("prdcer_lyr_id" in item) {
      // Render UserLayerCard if item is a user layer
      return (
        <UserLayerCard
          key={item.prdcer_lyr_id}
          id={item.prdcer_lyr_id}
          name={item.prdcer_layer_name}
          description={item.layer_description}
          legend={item.layer_legend}
          typeOfCard="layer"
          points_color={item.points_color}
          onMoreInfo={function () {
            handleCatalogCardClick({
              id: item.prdcer_lyr_id,
              name: item.prdcer_layer_name,
              typeOfCard: "layer",
              points_color: isValidColor(item.points_color as string)
                ? item.points_color
                : undefined,
              legend: item.layer_legend,
            });
          }}
        />
      );
    } else {
      // Render CatalogueCard if item is a catalog
      var typeOfCard = "prdcer_ctlg_name" in item ? "userCatalog" : "catalog";
      return (
        <CatalogueCard
          key={item.id || item.prdcer_ctlg_id || ""}
          id={item.id || item.prdcer_ctlg_id || ""}
          thumbnail_url={item.thumbnail_url || ""}
          name={item.name || item.prdcer_ctlg_name || ""}
          records_number={item.records_number || item.total_records || 0}
          description={item.description || item.ctlg_description || ""}
          onMoreInfo={function () {
            handleCatalogCardClick({
              id: item.id || item.prdcer_ctlg_id || "",
              name: item.name || item.prdcer_ctlg_name || "",
              typeOfCard: typeOfCard,
              ...(typeOfCard === "userCatalog" && { lyrs: item.lyrs }),
            });
          }}
          can_access={item.can_access ?? false}
          typeOfCard={typeOfCard}
        />
      );
    }
  }


  // Render cards based on filtered data
  function renderCards() {
    if (typeof filteredData === "string") {
      return <div>{filteredData}</div>;
    }

    if (Array.isArray(filteredData)) {
      return filteredData.map(function (item) {
        return makeCard(item);
      });
    }

    return null;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.dataContainer}>
      <h2 className={styles.dataHeading}>
        {selectedContainerType === "Catalogue" ||
        selectedContainerType === "Home"
          ? "Add Data to Map"
          : "Add Layers to Map"}
      </h2>
      <div className={styles.tabMenu}>
        <button
          className={
            (activeTab === "Data Catalogue" &&
              selectedContainerType === "Catalogue") ||
            (activeTab === "Data Layer" && selectedContainerType === "Layer")
              ? styles.activeTab
              : styles.tabButton
          }
          onClick={function () {
            setActiveTab(
              selectedContainerType === "Catalogue" ||
                selectedContainerType === "Home"
                ? "Data Catalogue"
                : "Data Layer"
            );
          }}
        >
          {selectedContainerType === "Catalogue" ||
          selectedContainerType === "Home"
            ? "Data Catalogue"
            : "Data Layer"}
        </button>
        <button
          className={
            activeTab === "Load Files" ? styles.activeTab : styles.tabButton
          }
          onClick={function () {
            setActiveTab("Load Files");
          }}
        >
          Load Files
        </button>
        <button
          className={
            activeTab === "Connect Your Data"
              ? styles.activeTab
              : styles.tabButton
          }
          onClick={function () {
            setActiveTab("Connect Your Data");
          }}
        >
          Connect Your Data
        </button>
      </div>
      {activeTab === "Data Catalogue" || activeTab === "Data Layer" ? (
        <div className={styles.dataGrid}>{renderCards()}</div>
      ) : activeTab === "Load Files" ? (
        <div className={styles.placeholderContent}>Load Files Content</div>
      ) : (
        <div className={styles.placeholderContent}>
          Connect Your Data Content
        </div>
      )}
    </div>
  );
}

export default DataContainer;
