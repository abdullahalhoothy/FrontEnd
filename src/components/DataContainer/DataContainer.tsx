import React, { useState, useEffect } from "react";
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
import { MapFeatures } from "../../types/allTypesAndInterfaces";
import UserLayerCard from "../UserLayerCard/UserLayerCard";
import userIdData from "../../currentUserId.json";
import { isValidColor } from "../../utils/helperFunctions";
import { useAuth } from "../../context/AuthContext"; // Add this import
import { useNavigate } from "react-router-dom";
import { useUIContext } from "../../context/UIContext";
import apiRequest from "../../services/apiRequest";

function DataContainer() {
  const { selectedContainerType, handleAddClick, setGeoPoints } =
    useCatalogContext();
  const { isAuthenticated, authResponse, logout } = useAuth();
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
  const [wsResError, setWsResError] = useState<Error | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch catalog collection data
    async function fetchCatalogCollection() {
      setLoading(true);
      // HttpReq<Catalog[]>(
      //   urls.catlog_collection,
      //   setCatalogCollectionData,
      //   setResMessage,
      //   setResId,
      //   setLoading,
      //   setError
      // );
      try {
        const res = await apiRequest({
          url: urls.catlog_collection,
          method: "get",
        });
        setCatalogCollectionData(res.data.data);
        setResMessage(res.data.message);
        setResId(res.data.request_id);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserLayers() {
      setLoading(true);

      const body = { user_id: authResponse?.localId };
      // HttpReq<UserLayer[]>(
      //   urls.user_layers,
      //   setUserLayersData,
      //   setResMessage,
      //   setResId,
      //   setLoading,
      //   setError,
      //   "post",
      //   body,
      //   authResponse.idToken // Add this line
      // );
      try {
        const res = await apiRequest({
          url: urls.user_layers,
          method: "post",
          isAuthRequest: true,
          body: body,
        });
        setUserLayersData(res.data.data);
        setResMessage(res.data.message);
        setResId(res.data.request_id);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserCatalogs() {
      setLoading(true);

      const body = { user_id: authResponse?.localId };
      // HttpReq<Catalog[]>(
      //   urls.user_catalogs,
      //   setUserCatalogsData,
      //   setResMessage,
      //   setResId,
      //   setLoading,
      //   setError,
      //   "post",
      //   body,
      //   authResponse.idToken // Add this line
      // );
      try {
        const res = await apiRequest({
          url: urls.user_catalogs,
          method: "post",
          isAuthRequest: true,
          body: body,
        });
        setUserCatalogsData(res.data.data);
        setResMessage(res.data.message);
        setResId(res.data.request_id);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    // Determine which data to fetch based on selected container type
    async function fetchData() {
      setLoading(true);
      setError(null);

      if (selectedContainerType === "Layer") {
        await fetchUserLayers();
      } else if (selectedContainerType === "Catalogue") {
        await fetchCatalogCollection();
        await fetchUserCatalogs();
      } else if (selectedContainerType === "Home") {
        await fetchCatalogCollection();
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedContainerType, authResponse]);

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

  // Handle click event on catalog card
  async function handleCatalogCardClick(selectedItem: CardItem) {
    if (selectedContainerType === "Home") {
      // HttpReq<MapFeatures[]>(
      //   urls.http_catlog_data,
      //   setGeoPoints,
      //   setWsResMessage,
      //   setWsResId,
      //   setWsResLoading,
      //   setWsResError,
      //   "post",
      //   { catalogue_dataset_id: selectedItem.id }
      // );
      setWsResLoading(true);
      try {
        const res = await apiRequest({
          url: urls.http_catlog_data,
          method: "post",
          body: { catalogue_dataset_id: selectedItem.id },
        });
        setGeoPoints(res.data.data);
        setWsResMessage(res.data.message);
        setWsResId(res.data.request_id);
      } catch (error) {
        setWsResError(error);
      } finally {
        setWsResLoading(false);
      }
    }

    if (selectedContainerType !== "Home") {
      handleAddClick(
        selectedItem.id,
        selectedItem.name,
        selectedItem.typeOfCard,
        selectedItem.legend,
        selectedItem.lyrs
      );
    }

    closeModal();
  }

  // Render a card based on the item type
  function makeCard(item: Catalog | UserLayer, index: number) {
    if ("prdcer_lyr_id" in item) {
      // Render UserLayerCard if item is a user layer
      return (
        <UserLayerCard
          key={item.prdcer_lyr_id + "-" + index} // Use a combination of id and index
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
          key={(item.id || item.prdcer_ctlg_id || "") + "-" + index}
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
    if (typeof resData === "string") {
      return <div>{resData}</div>;
    }

    if (Array.isArray(resData)) {
      return resData.map(function (item, index) {
        return makeCard(item, index);
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
    <div className="lg:p-6 p-2">
      <h2 className="text-2xl text-center font-semibold">
        {selectedContainerType === "Catalogue" ||
        selectedContainerType === "Home"
          ? "Add Data to Map"
          : "Add Layers to Map"}
      </h2>
      <div className="flex flex-wrap lg:gap-0 gap-2 w-full justify-center items-center my-4 rounded-xl font-semibold">
        <button
          className={`${
            (activeTab === "Data Catalogue" &&
              selectedContainerType === "Catalogue") ||
            (activeTab === "Data Layer" && selectedContainerType === "Layer")
              ? "bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5"
              : "bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]"
          } text-nowrap flex-1`}
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
          className={`${
            activeTab === "Load Files"
              ? "bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5"
              : "bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]"
          } text-nowrap flex-1`}
          onClick={function () {
            setActiveTab("Load Files");
          }}
        >
          Load Files
        </button>
        <button
          className={`${
            activeTab === "Connect Your Data"
              ? "bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5"
              : "bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]"
          } text-nowrap flex-1`}
          onClick={function () {
            setActiveTab("Connect Your Data");
          }}
        >
          Connect Your Data
        </button>
      </div>
      {activeTab === "Data Catalogue" || activeTab === "Data Layer" ? (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-x-2 gap-y-3 overflow-y-auto w-full">
          {renderCards()}
        </div>
      ) : activeTab === "Load Files" ? (
        <div className="text-center p-8 text-[1.2rem] text-[#666]">
          Load Files Content
        </div>
      ) : (
        <div className="text-center p-8 text-[1.2rem] text-[#666]">
          Connect Your Data Content
        </div>
      )}
    </div>
  );
}

export default DataContainer;
