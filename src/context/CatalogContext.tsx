import {
  CatalogContextType,
  GradientColorBasedOnZone,
  MapFeatures,
  ReqGradientColorBasedOnZone,
  SaveResponse,
  VisualizationMode,
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
import html2canvas from "html2canvas";

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
  const [colors, setColors] = useState<string[][]>([]);

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
  const [selectedBasedon, setSelectedBasedon] = useState<string>("");
  const [layerColors, setLayerColors] = useState({});
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('vertex');
  const [deletedLayers, setDeletedLayers] = useState<{
    layer: MapFeatures;
    index: number;
    timestamp: number;
  }[]>([]);
  const [basedOnLayerId, setBasedOnLayerId] = useState<string | null>(null);

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

  async function generateThumbnail(): Promise<string> {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.warn('Map container not found');
      return '';
    }

    try {
      const canvas = await html2canvas(mapContainer);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      return thumbnailDataUrl;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return '';
    }
  }

  async function handleSaveCatalog() {
    if (!authResponse || !("idToken" in authResponse)) {
      setIsError(new Error("User is not authenticated!"));
      navigate("/auth");
      return;
    }

    try {
      setIsLoading(true);
      
      const thumbnailDataUrl = await generateThumbnail();

      const formData = new FormData();

      if (thumbnailDataUrl) {
        const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob());
        formData.append('image', thumbnailBlob, 'thumbnail.jpg');
      }

      const requestBody = {
        message: "Save catalog request",
        request_info: {},
        request_body: {
          prdcer_ctlg_name: name,
          subscription_price: subscriptionPrice,
          ctlg_description: description,
          total_records: 0,
          lyrs: geoPoints.map(layer => ({
            layer_id: layer.prdcer_lyr_id,
            points_color: layer.points_color
          })),
          user_id: authResponse.localId,
          display_elements: geoPoints.map(layer => ({
            layer_id: layer.layerId,
            display: layer.display,
            points_color: layer.points_color,
            is_heatmap: layer.is_heatmap,
            is_grid: layer.is_grid
          })),
          catalog_layer_options: geoPoints.map(layer => ({
            layer_id: layer.layerId,
            is_enabled: layer.is_enabled || true,
            opacity: layer.opacity || 1
          }))
        }
      };

      formData.append('req', JSON.stringify(requestBody));

      const res = await apiRequest({
        url: urls.save_producer_catalog,
        method: "post",
        body: formData,
        isAuthRequest: true,
        isFormData: true,
      });

      setSaveResponse(res.data.data);
      setSaveResponseMsg(res.data.message);
      setSaveReqId(res.data.id);
      setFormStage("catalog");
      resetState();
    } catch (error) {
      setIsError(error instanceof Error ? error : new Error('Failed to save catalog'));
    } finally {
      setIsLoading(false);
    }
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

  function updateLayerColor(layerId: number, newColor: string) {
    setGeoPoints(prevPoints => 
      prevPoints.map(point => {
        if (point.layerId === layerId) {
          return {
            ...point,
            points_color: newColor,
            display: point.display ?? true
          };
        }
        return point;
      })
    );
  }

  function updateLayerDisplay(layerIndex: number, display: boolean) {
    setGeoPoints(function (prevGeoPoints) {
      const updatedGeoPoints = prevGeoPoints.slice();
      updatedGeoPoints[layerIndex].display = display;
      return updatedGeoPoints;
    });
    // Bounds will be recalculated via useEffect in MapContainer
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
      // Store the deleted layer with its metadata
      const removedLayer = prevGeoPoints[layerIndex];
      setDeletedLayers(prev => [...prev, {
        layer: removedLayer,
        index: layerIndex,
        timestamp: Date.now()
      }]);
      
      // Filter out the layer with the matching layerId
      return prevGeoPoints.filter(point => point.layerId !== layerIndex);
    });
  }

  function restoreLayer(timestamp: number) {
    const deletedLayer = deletedLayers.find(layer => layer.timestamp === timestamp);
    if (!deletedLayer) return;

    setGeoPoints(prev => {
      const newLayers = [...prev];
      newLayers.splice(deletedLayer.index, 0, deletedLayer.layer);
      return newLayers;
    });

    setDeletedLayers(prev => prev.filter(layer => layer.timestamp !== timestamp));
  }

  function updateLayerVisualization(layerIndex: number, mode: VisualizationMode) {
    setGeoPoints(function (prevGeoPoints) {
      const updatedGeoPoints = prevGeoPoints.slice();
      updatedGeoPoints[layerIndex] = {
        ...updatedGeoPoints[layerIndex],
        visualization_mode: mode,
        is_heatmap: mode === 'heatmap',
        is_grid: mode === 'grid'
      };
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
    /**
   {
      "color_grid_choice": [
        "string"
      ],
      "change_lyr_id": "string",
      "change_lyr_name": "string",
      "based_on_lyr_id": "string",
      "based_on_lyr_name": "string",
      "offset_value": 0,
      "color_based_on": "string"
    }
     */

    console.log(`#feat multicolor: reqGradientColorBasedOnZone ${JSON.stringify(reqGradientColorBasedOnZone)}`);

    const postData: {
      color_grid_choice: string[];    // Array of colors for the gradient palette
      change_lyr_id: string;         // ID of the layer being recolored
      change_lyr_name: string;       // Name of the layer being recolored
      based_on_lyr_id: string;       // ID of the layer we're comparing against
      based_on_lyr_name: string;     // Name of the layer we're comparing against
      offset_value: number;          // Distance/radius value for comparison
      color_based_on: string;        // Metric to base coloring on (e.g., "rating", "exists")
    } = {
      color_grid_choice: reqGradientColorBasedOnZone.color_grid_choice,
      change_lyr_id: reqGradientColorBasedOnZone.change_lyr_id,
      change_lyr_name: reqGradientColorBasedOnZone.change_lyr_name,
      based_on_lyr_id: reqGradientColorBasedOnZone.based_on_lyr_id,
      based_on_lyr_name: reqGradientColorBasedOnZone.based_on_lyr_name,
      offset_value: reqGradientColorBasedOnZone.offset_value,
      color_based_on: reqGradientColorBasedOnZone.color_based_on
    };

    console.log(`#feat multicolor: postData ${JSON.stringify(postData)}`);

    const disabled = false;

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
    if (!disabled && reqGradientColorBasedOnZone.change_lyr_id.length > 0) {
      try {
        setLocalLoading(true);
        const res = await apiRequest({
          url: urls.gradient_color_based_on_zone,
          method: "post",
          body: postData,
          isAuthRequest: true,
        });

        if (res.data?.data && Array.isArray(res.data.data)) {
          // Store all gradient groups
          setGradientColorBasedOnZone(res.data.data);
          setPostResMessage(res.data.message);
          setPostResId(res.data.request_id);

          // Combined features approach is now handled in MultipleLayersSetting
        }
      } catch (error) {
        setIsError(error instanceof Error ? error : new Error(String(error)));
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

  function updateLayerGrid(layerIndex: number, isGrid: boolean) {
    setGeoPoints(function (prevGeoPoints) {
      const updatedGeoPoints = prevGeoPoints.slice();
      if (isGrid) {
        // If enabling grid, disable heatmap
        updatedGeoPoints[layerIndex] = {
          ...updatedGeoPoints[layerIndex],
          is_grid: true,
          is_heatmap: false
        };
      } else {
        updatedGeoPoints[layerIndex] = {
          ...updatedGeoPoints[layerIndex],
          is_grid: false
        };
      }
      return updatedGeoPoints;
    });
  }

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
        handleSaveCatalog,
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
        updateLayerGrid,
        deletedLayers,
        restoreLayer,
        visualizationMode,
        setVisualizationMode,
        basedOnLayerId,
        setBasedOnLayerId
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
