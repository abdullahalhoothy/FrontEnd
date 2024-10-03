import {
  CatalogContextType,
  GradientColorBasedOnZone,
  MapFeatures,
  ReqGradientColorBasedOnZone,
  SaveResponse,
} from "../types/allTypesAndInterfaces";
import { HttpReq } from "../services/apiService";
import urls from "../urls.json";
import userIdData from "../currentUserId.json";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import apiRequest from "../services/apiRequest";

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider(props: { children: ReactNode }) {
  const { authResponse } = useAuth(); // Add this line
  const navigate = useNavigate();
  const { children } = props;

  const [formStage, setFormStage] = useState<
    "catalog" | "catalogDetails" | "save"
  >("catalog");
  const [saveMethod, setSaveMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [legendList, setLegendList] = useState<string[]>([]);
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [selectedContainerType, setSelectedContainerType] = useState<
    "Catalogue" | "Layer" | "Home"
  >("Home");

  const [geoPoints, setGeoPoints] = useState<MapFeatures[]>([]);
  const [lastGeoIdRequest, setLastGeoIdRequest] = useState<
    string | undefined
  >();
  const [lastGeoMessageRequest, setLastGeoMessageRequest] = useState<
    string | undefined
  >();
  const [lastGeoError, setLastGeoError] = useState<Error | null>(null);

  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    hex: string;
  } | null>(null);

  // const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
  //   null
  // );
  // const [openDropdownIndex1, setOpenDropdownIndex1] = useState<number | null>(
  //   null
  // );
  // const [openDropdownIndex2, setOpenDropdownIndex2] = useState<number | null>(
  //   null
  // );
  // const [openDropdownIndex3, setOpenDropdownIndex3] = useState<number | null>(
  //   null
  // );
  const [openDropdownIndices, setOpenDropdownIndices] = useState<
    (number | null)[]
  >([null, null, null, null]);
  const [saveResponse, setSaveResponse] = useState<SaveResponse | null>(null);
  const [saveResponseMsg, setSaveResponseMsg] = useState("");
  const [saveReqId, setSaveReqId] = useState("");
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState({});
  const [radiusInput, setRadiusInput] = useState<number | null>(null);
  const [isRadiusMode, setIsRadiusMode] = useState(false);
  const [colors, setColors] = useState<string[]>([]);

  const [reqGradientColorBasedOnZone, setReqGradientColorBasedOnZone] =
    useState<ReqGradientColorBasedOnZone>({
      prdcer_lyr_id: "",
      user_id: "",
      color_grid_choice: [],
      change_lyr_id: "",
      based_on_lyr_id: "",
      radius_offset: 0,
      color_based_on: "",
    });
  const [gradientColorBasedOnZone, setGradientColorBasedOnZone] = useState<
    GradientColorBasedOnZone[]
  >([]);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [postResMessage, setPostResMessage] = useState<string>("");
  const [postResId, setPostResId] = useState<string>("");
  const [chosenPallet, setChosenPallet] = useState(null);
  const [selectedBasedon, setSelectedBasedon] = useState<string>("rating");
  const [layerColors, setLayerColors] = useState({});

  useEffect(
    function () {
      handleColorBasedZone();
    },
    [reqGradientColorBasedOnZone]
  );
  // Restore geoPoints from localStorage
  useEffect(() => {
    const savedGeoPoints = localStorage.getItem("unsavedGeoPoints");
    if (savedGeoPoints) {
      const parsedGeoPoints = JSON.parse(savedGeoPoints);
      if (parsedGeoPoints && parsedGeoPoints.length > 0) {
        setGeoPoints(parsedGeoPoints);
      }
    }
  }, []);

  async function fetchGeoPoints(id: string, typeOfCard: string) {
    if (!authResponse || !("idToken" in authResponse)) {
      setIsError(new Error("User is not authenticated!"));
      navigate("/auth");
      return;
    }
    const apiJsonRequest =
      typeOfCard === "layer"
        ? {
            prdcer_lyr_id: id,
            user_id: userIdData.user_id,
          }
        : typeOfCard === "userCatalog"
        ? { prdcer_ctlg_id: id, as_layers: true, user_id: authResponse.localId }
        : { catalogue_dataset_id: id };

    const url =
      typeOfCard === "layer"
        ? urls.prdcer_lyr_map_data
        : typeOfCard === "userCatalog"
        ? urls.fetch_ctlg_lyrs
        : urls.http_catlog_data;

    let unprocessedData: MapFeatures | MapFeatures[] | null = null;

    const callData = function (data: MapFeatures | MapFeatures[]) {
      unprocessedData = data;
    };

    // await HttpReq<MapFeatures | MapFeatures[]>(
    //   url,
    //   callData,
    //   setLastGeoMessageRequest,
    //   setLastGeoIdRequest,
    //   setIsLoading,
    //   setIsError,
    //   "post",
    //   apiJsonRequest,
    //   authResponse.idToken
    // );

    try {
      setIsLoading(true);
      const res = await apiRequest({
        url: url,
        method: "post",
        body: apiJsonRequest,
        isAuthRequest: true,
      });
      callData(res.data.data);
      setLastGeoMessageRequest(res.data.message);
      setLastGeoIdRequest(res.data.id);
    } catch (error) {
      setIsError(error);
    } finally {
      setIsLoading(false);
    }
    if (isError) {
      console.error("An error occurred while fetching geo points.");
      return;
    }

    if (unprocessedData) {
      var updatedDataArray = (
        Array.isArray(unprocessedData) ? unprocessedData : [unprocessedData]
      ).map(function (layer) {
        return Object.assign({}, layer, { display: true });
      });

      setGeoPoints(function (prevGeoPoints) {
        return prevGeoPoints.concat(updatedDataArray);
      });
    }
  }

  function handleAddClick(
    id: string,
    name: string,
    typeOfCard: string,
    legend?: string,
    layers?: { layer_id: string; points_color: string }[]
  ) {
    fetchGeoPoints(id, typeOfCard);
  }

  async function handleSaveLayer() {
    if (!authResponse || !("idToken" in authResponse)) {
      setIsError(new Error("User is not authenticated!"));
      navigate("/auth");
      return;
    }
    const layersData = Array.isArray(geoPoints)
      ? geoPoints.map((layer) => ({
          layer_id: layer.prdcer_lyr_id,
          points_color: layer.points_color,
        }))
      : [];

    const requestBody = {
      prdcer_ctlg_name: name,
      subscription_price: subscriptionPrice,
      ctlg_description: description,
      total_records: 0,
      lyrs: layersData,
      user_id: authResponse.localId,
      thumbnail_url: "",
    };

    // HttpReq(
    //   urls.save_producer_catalog,
    //   setSaveResponse,
    //   setSaveResponseMsg,
    //   setSaveReqId,
    //   setIsLoading,
    //   setIsError,
    //   "post",
    //   requestBody,
    //   authResponse.idToken
    // );
    try {
      setIsLoading(true);
      const res = await apiRequest({
        url: urls.save_producer_catalog,
        method: "post",
        body: requestBody,
        isAuthRequest: true,
      });
      setSaveResponse(res.data.data);
      setSaveResponseMsg(res.data.message);
      setSaveReqId(res.data.id);
    } catch (error) {
      setIsError(error);
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => {
      resetFormStage("catalog");
    }, 1000);
  }

  function resetFormStage(resetTo: "catalog") {
    setDescription("");
    setName("");
    setSubscriptionPrice(" ");
    setSaveResponse(null);
    setIsError(null);
    setFormStage(resetTo);
  }

  function resetState() {
    setGeoPoints([]);
    setLastGeoIdRequest(undefined);
    setLastGeoMessageRequest(undefined);
    setLastGeoError(null);
    localStorage.removeItem("unsavedGeoPoints");
  }

  function updateLayerColor(layerIndex: number | null, newColor: string) {
    setGeoPoints(function (prevGeoPoints) {
      const updatedGeoPoints = prevGeoPoints.map(function (geoPoint, index) {
        if (layerIndex === null || layerIndex === index) {
          return Object.assign({}, geoPoint, {
            points_color:
              typeof newColor === "string"
                ? newColor.toLowerCase()
                : geoPoint.points_color,
          });
        }
        return geoPoint;
      });
      return updatedGeoPoints;
    });
  }

  function updateLayerDisplay(layerIndex: number, display: boolean) {
    setGeoPoints(function (prevGeoPoints) {
      var updatedGeoPoints = prevGeoPoints.slice();
      updatedGeoPoints[layerIndex].display = display;
      return updatedGeoPoints;
    });
  }

  function updateLayerHeatmap(layerIndex: number, isHeatmap: boolean) {
    setGeoPoints(function (prevGeoPoints) {
      var updatedGeoPoints = prevGeoPoints.slice();
      updatedGeoPoints[layerIndex].is_heatmap = isHeatmap;
      return updatedGeoPoints;
    });
  }

  function removeLayer(layerIndex: number) {
    setGeoPoints(function (prevGeoPoints) {
      var updatedGeoPoints = prevGeoPoints.filter(function (_, index) {
        return index !== layerIndex;
      });
      return updatedGeoPoints;
    });
  }

  async function handleColorBasedZone() {
    let idToken: string;

    if (authResponse && "idToken" in authResponse) {
      idToken = authResponse.idToken;
    } else {
      idToken = "";
    }
    const postData = {
      prdcer_lyr_id: reqGradientColorBasedOnZone.prdcer_lyr_id,
      user_id: reqGradientColorBasedOnZone.user_id,
      color_grid_choice: reqGradientColorBasedOnZone.color_grid_choice,
      change_lyr_id: reqGradientColorBasedOnZone.change_lyr_id,
      based_on_lyr_id: reqGradientColorBasedOnZone.based_on_lyr_id,
      radius_offset: reqGradientColorBasedOnZone.radius_offset,
      color_based_on: reqGradientColorBasedOnZone.color_based_on,
    };
    // HttpReq<GradientColorBasedOnZone[]>(
    //   urls.gradient_color_based_on_zone,
    //   setGradientColorBasedOnZone,
    //   setPostResMessage,
    //   setPostResId,
    //   setLocalLoading,
    //   setIsError,
    //   "post",
    //   postData,
    //   idToken
    // );
    if (reqGradientColorBasedOnZone.prdcer_lyr_id.length > 0) {
      try {
        setLocalLoading(true);
        const res = await apiRequest({
          url: urls.gradient_color_based_on_zone,
          method: "post",
          body: postData,
          isAuthRequest: true,
        });
        setGradientColorBasedOnZone(res.data.data);
        setPostResMessage(res.data.message);
        setPostResId(res.data.id);
      } catch (error) {
        setIsError(error);
      } finally {
        setLocalLoading(false);
      }
    }
  }
  const updateDropdownIndex = (index: number, value: number | null) => {
    setOpenDropdownIndices((prev) => {
      const updatedIndices = [...prev];
      updatedIndices[index] = value;
      return updatedIndices;
    });
  };
  return (
    <CatalogContext.Provider
      value={{
        formStage,
        saveMethod,
        isLoading,
        isError,
        legendList,
        subscriptionPrice,
        description,
        name,
        setFormStage,
        setSaveMethod,
        setIsLoading,
        setIsError,
        setLegendList,
        setSubscriptionPrice,
        setDescription,
        setName,
        handleAddClick,
        handleSaveLayer,
        resetFormStage,
        selectedContainerType,
        setSelectedContainerType,
        geoPoints,
        setGeoPoints,
        selectedColor,
        setSelectedColor,

        resetState,
        saveResponse,
        saveResponseMsg,
        saveReqId,
        setSaveResponse,
        updateLayerColor,
        updateLayerDisplay,
        updateLayerHeatmap,
        removeLayer,
        isAdvanced,
        setIsAdvanced,
        isAdvancedMode,
        setIsAdvancedMode,
        setRadiusInput,
        radiusInput,
        openDropdownIndices,
        setOpenDropdownIndices,
        updateDropdownIndex,
        colors,
        setColors,
        chosenPallet,
        setChosenPallet,
        reqGradientColorBasedOnZone,
        setReqGradientColorBasedOnZone,
        gradientColorBasedOnZone,
        setGradientColorBasedOnZone,
        handleColorBasedZone,
        selectedBasedon,
        setSelectedBasedon,
        layerColors,
        setLayerColors,
        isRadiusMode,
        setIsRadiusMode,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalogContext() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalogContext must be used within a CatalogProvider");
  }
  return context;
}
