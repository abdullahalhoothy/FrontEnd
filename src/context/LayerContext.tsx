// src/context/LayerContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import { HttpReq } from "../services/apiService";
import {
  FetchDatasetResponse,
  LayerContextType,
  SaveResponse,
  ReqFetchDataset,
  City,
  CategoryData,
  LayerDataMap,
  LayerCustomization,
  LayerState,
  MapFeatures,
} from "../types/allTypesAndInterfaces";
import urls from "../urls.json";
import { useCatalogContext } from "./CatalogContext";
import userIdData from "../currentUserId.json";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { processCityData, getDefaultLayerColor } from "../utils/helperFunctions";
import apiRequest from "../services/apiRequest";
import { defaultMapConfig } from "../hooks/map/useMapInitialization";

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider(props: { children: ReactNode }) {
  const navigate = useNavigate();
  const { authResponse } = useAuth();
  const { children } = props;
  const { geoPoints, setGeoPoints } = useCatalogContext();
  // State from useLocationAndCategories
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesData, setCitiesData] = useState<{ [country: string]: City[] }>(
    {}
  );
  const [categories, setCategories] = useState<CategoryData>({});
  const [reqFetchDataset, setReqFetchDataset] = useState<ReqFetchDataset>({
    selectedCountry: "",
    selectedCity: "",
    layers: [],
    includedTypes: [],
    excludedTypes: [],
    zoomLevel: defaultMapConfig.zoomLevel
  });
  const [reqSaveLayer, setReqSaveLayer] = useState({
    legend: "",
    description: "",
    name: "",
  });

  const [createLayerformStage, setCreateLayerformStage] =
    useState<string>("initial");
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [manyFetchDatasetResp, setManyFetchDatasetResp] = useState<
    FetchDatasetResponse | undefined
  >(undefined);
  const [FetchDatasetResp, setFetchDatasetResp] =
    useState<FetchDatasetResponse | null>(null);
  const [saveMethod, setSaveMethod] = useState<string>("");
  const [datasetInfo, setDatasetInfo] = useState<{
    bknd_dataset_id: string;
    prdcer_lyr_id: string;
  } | null>(null);

  const [saveResponse, setSaveResponse] = useState<SaveResponse | null>(null);
  const [saveResponseMsg, setSaveResponseMsg] = useState<string>("");
  const [saveReqId, setSaveReqId] = useState<string>("");

  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    hex: string;
  } | null>(null);
  const [saveOption, setSaveOption] = useState<string>("");

  const [centralizeOnce, setCentralizeOnce] = useState<boolean>(false);
  const [initialFlyToDone, setInitialFlyToDone] = useState<boolean>(false);

  const [showLoaderTopup, setShowLoaderTopup] = useState<boolean>(false);

  const [postResMessage, setPostResMessage] = useState<string>("");
  const [postResId, setPostResId] = useState<string>("");

  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [textSearchInput, setTextSearchInput] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("category_search");
  const [password, setPassword] = useState<string>("");

  const pageCountsRef = useRef<{[layerId: string]: number}>({});
  const MAX_CALLS = 10;

  const [layerDataMap, setLayerDataMap] = useState<LayerDataMap>({});

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const [layerStates, setLayerStates] = useState<{ [layerId: number]: LayerState }>({});

  function incrementFormStage() {
    if (createLayerformStage === "initial") {
      setCreateLayerformStage("secondStep");
    } else if (createLayerformStage === "secondStep") {
      setCreateLayerformStage("thirdStep");
    }
  }

  async function handleSaveLayer(layerData: LayerCustomization | { layers: LayerCustomization[] }) {
    if ('layers' in layerData) {
      // Handle multiple layers
      for (const layer of layerData.layers) {
        await saveSingleLayer(layer);
      }
    } else {
      // Handle single layer
      await saveSingleLayer(layerData);
    }
  }

  async function saveSingleLayer(layerData: LayerCustomization) {
    const postData = {
      prdcer_layer_name: layerData.name,
      prdcer_lyr_id: layerDataMap[layerData.layerId]?.prdcer_lyr_id,
      bknd_dataset_id: layerDataMap[layerData.layerId]?.bknd_dataset_id,
      points_color: layerData.color,
      layer_legend: layerData.legend,
      layer_description: layerData.description,
      city_name: reqFetchDataset.selectedCity,
      user_id: authResponse?.localId,
    };

    try {
      const res = await apiRequest({
        url: urls.save_layer,
        method: "post",
        body: postData,
        isAuthRequest: true,
      });
      setSaveResponse(res.data.data);
      setSaveResponseMsg(res.data.message);
      setSaveReqId(res.data.id);
    } catch (error) {
      setIsError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  function resetFormStage() {
    setIsError(null);
    setCreateLayerformStage("initial");
  }

  function updateGeoJSONDataset(response: FetchDatasetResponse, layerId: number, defaultName: string) {
    setGeoPoints((prevPoints: MapFeatures[] | MapFeatures | any) => {
      const layerKey = String(layerId);
      pageCountsRef.current[layerKey] = (pageCountsRef.current[layerKey] || 0) + 1;

      // Skip merging if response has no features
      if (!response.features?.length) {
        console.warn(`No features in response for layer ${layerId}, skipping...`);
        return prevPoints;
      }

      const existingPoint = prevPoints.find((p: MapFeatures) => String(p.layerId) === String(layerId));
      
      const newPoint = {
        type: 'FeatureCollection',
        features: [
          ...(existingPoint?.features || []),  // Keep existing features if any
          ...response.features.map(f => ({ 
            type: 'Feature',
            geometry: f.geometry,
            properties: f.properties,
            layerId: String(layerId)
          }))
        ],
        display: true,
        points_color: existingPoint?.points_color || getDefaultLayerColor(layerId),
        layerId: String(layerId),
        city_name: reqFetchDataset.selectedCity,
        layer_legend: defaultName,
        prdcer_layer_name: defaultName,
        prdcer_lyr_id: response.prdcer_lyr_id,
        bknd_dataset_id: response.bknd_dataset_id
      };

      const filteredPoints = prevPoints.filter(p => 
        String(p.layerId) !== String(layerId)
      );
      const newPoints = [...filteredPoints, newPoint];

      // Continue pagination even if current page had issues
      if (response.next_page_token && pageCountsRef.current[layerKey] < MAX_CALLS) {
        handleFetchDataset("full data", response.next_page_token).catch(err => {
          console.error(`Error fetching page for layer ${layerId}:`, err);
          // Continue to next page despite error
          if (pageCountsRef.current[layerKey] < MAX_CALLS) {
            handleFetchDataset("full data", response.next_page_token);
          }
        });
      } else {
        setShowLoaderTopup(false);
        delete pageCountsRef.current[layerKey];
      }
      
      return newPoints;
    });
  }

  async function handleFetchDataset(action: string, pageToken?: string) {    
    // Clear existing data on initial request (when no pageToken)
    if (!pageToken) {
      setGeoPoints([]);
      setLayerDataMap({});
    }

    let user_id: string;
    let idToken: string;

    try {
      if (authResponse && "idToken" in authResponse) {
        user_id = authResponse.localId;
        idToken = authResponse.idToken;
      } else if (action == "full data") {
        navigate("/auth");
        setIsError(new Error("User is not authenticated!"));
        return;
      } else {
        user_id = "0000";
        idToken = "";
      }

      for (const layer of reqFetchDataset.layers) {
        try {
          // Verify that this layer ID isn't already processed
          if (layerDataMap[layer.id]) {
            console.warn(`Layer ${layer.id} already processed, skipping...`);
            continue;
          }

          // Generate default name for layer
          const defaultName = `${reqFetchDataset.selectedCountry} ${reqFetchDataset.selectedCity} ${
            layer.includedTypes?.map(type => type.replace("_", " ")).join(" + ") || ''
          }${
            layer.excludedTypes?.length > 0 
              ? " + not " + layer.excludedTypes.map(type => type.replace("_", " ")).join(" + not ")
              : ""
          }`;

          //TODO: Further improve when working on the "OR" feature
          const res = await apiRequest({
            url: urls.fetch_dataset,
            method: "post",
            body: {
              country_name: reqFetchDataset.selectedCountry,
              city_name: reqFetchDataset.selectedCity,
              //includedTypes: layer.includedTypes || [],
              //excludedTypes: layer.excludedTypes || [],
              boolean_query: layer.includedTypes?.join(" OR "),
              layerId: layer.id,
              layer_name: defaultName,
              action: action,
              search_type: searchType,
              text_search: textSearchInput?.trim() || "",
              page_token: pageToken || "",
              user_id: user_id,
              zoom_level: reqFetchDataset.zoomLevel ?? defaultMapConfig.zoomLevel
            },
            isAuthRequest: true,
          });

          if (res?.data?.data) {
            setLayerDataMap(prev => ({
              ...prev,
              [layer.id]: res.data.data
            }));
            
            updateGeoJSONDataset(res.data.data, layer.id, defaultName);
          }
        } catch (error) {
          console.error(`Error fetching layer ${layer.id}:`, error);
          setIsError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    } catch (error) {
      setIsError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Set loader back to false after all operations complete
      setShowLoaderTopup(false);
    }
  }

  async function handleGetCountryCityCategory() {
    // HttpReq<string[]>(
    //   urls.country_city,
    //   (data) => setCountries(processCityData(data, setCitiesData)),
    //   () => {},
    //   () => {},
    //   () => {},
    //   setIsError
    // );
    try {
      const res = await apiRequest({
        url: urls.country_city,
        method: "get",
      });
      setCountries(processCityData(res.data.data, setCitiesData));
    } catch (error) {
      setIsError(error);
    }

    try {
      const res = await apiRequest({
        url: urls.nearby_categories,
        method: "get",
      });
      setCategories(res.data.data);
    } catch (error) {
      setIsError(error);
    }
    // HttpReq<CategoryData>(
    //   urls.nearby_categories,
    //   setCategories,
    //   () => {},
    //   () => {},
    //   () => {},
    //   setIsError
    // );
  }

  function handleCountryCitySelection(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    if (name === "selectedCountry") {
      // Update country and reset city
      setSelectedCountry(value);
      setSelectedCity("");
      
      // Get cities for selected country
      const selectedCountryCities = citiesData[value] || [];
      setCities(selectedCountryCities);

      // Update reqFetchDataset
      setReqFetchDataset(prev => ({
        ...prev,
        selectedCountry: value,
        selectedCity: "", // Reset city when country changes
      }));
    } else if (name === "selectedCity") {
      // Update city
      setSelectedCity(value);
      
      // Update reqFetchDataset
      setReqFetchDataset(prev => ({
        ...prev,
        selectedCity: value,
      }));
    }
  }

  function handleTypeToggle(type: string) {
    setReqFetchDataset((prevData) => {
      if (prevData.includedTypes.includes(type)) {
        return {
          ...prevData,
          includedTypes: prevData.includedTypes.filter((t) => t !== type),
          excludedTypes: [...prevData.excludedTypes, type],
        };
      } else if (prevData.excludedTypes.includes(type)) {
        return {
          ...prevData,
          excludedTypes: prevData.excludedTypes.filter((t) => t !== type),
        };
      } else {
        return {
          ...prevData,
          includedTypes: [...prevData.includedTypes, type],
        };
      }
    });
  }

  function validateFetchDatasetForm() {
    if (!reqFetchDataset.selectedCountry || !reqFetchDataset.selectedCity) {
      return new Error("Country and city are required.");
    }
    if (
      reqFetchDataset.includedTypes.length === 0 &&
      reqFetchDataset.excludedTypes.length === 0 &&
      searchType !== "keyword_search"
    ) {
      console.log("At least one category must be included or excluded.", reqFetchDataset, searchType);
      return new Error("At least one category must be included or excluded.");
    }
    if (
      reqFetchDataset.includedTypes.length > 50 ||
      reqFetchDataset.excludedTypes.length > 50
    ) {
      return new Error(
        "Up to 50 types can be specified in each type restriction category."
      );
    }
    return true;
  }

  useEffect(() => {
    console.log("searchType", searchType);
  }, [searchType]);

  function resetFetchDatasetForm() {
    setReqFetchDataset({
      selectedCountry: "",
      selectedCity: "",
      layers: [],
      includedTypes: [],
      excludedTypes: [],
    });
    setLayerDataMap({});
    setSelectedCountry(""); // Reset country
    setSelectedCity(""); // Reset city
    setTextSearchInput("");
    setSearchType("category_search");
    setPassword("");
    setGeoPoints([]);
  }

  useEffect(() => {
    if (isError) {
      setShowLoaderTopup(false);
    }
  }, [isError]);

  useEffect(() => {
    handleGetCountryCityCategory();
  }, []);

  const updateLayerState = (layerId: number, updates: Partial<LayerState>) => {
    setLayerStates(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        ...updates
      }
    }));
  };

  useEffect(() => {
    if (reqFetchDataset?.layers?.length > 0) {
      // Initialize layer states while preserving existing states
      setLayerStates(prev => {
        const initialStates = reqFetchDataset.layers.reduce((acc, layer) => {
          if (layer && typeof layer.id === 'number') {
            acc[layer.id] = {
              ...prev[layer.id], // Preserve existing state if any
              selectedColor: prev[layer.id]?.selectedColor || null,
              isLoading: false, // Reset loading state
              saveResponse: prev[layer.id]?.saveResponse || null,
              datasetInfo: prev[layer.id]?.datasetInfo || null
            };
          }
          return acc;
        }, {} as { [key: number]: LayerState });

        return initialStates;
      });
    }
  }, [reqFetchDataset?.layers]);

  return (
    <LayerContext.Provider
      value={{
        reqSaveLayer,
        setReqSaveLayer,
        createLayerformStage,
        isError,
        manyFetchDatasetResp,
        saveMethod,
        loading,
        saveResponse,
        setFormStage: setCreateLayerformStage,
        setIsError,
        setManyFetchDatasetResp,
        setSaveMethod,
        setLoading,
        incrementFormStage,
        handleSaveLayer,
        resetFormStage,
        selectedColor,
        setSelectedColor,
        saveOption,
        setSaveOption,
        datasetInfo,
        setDatasetInfo,
        saveResponseMsg,
        setSaveResponseMsg,
        setSaveResponse,
        setSaveReqId,
        centralizeOnce,
        setCentralizeOnce,
        initialFlyToDone,
        setInitialFlyToDone,
        showLoaderTopup,
        setShowLoaderTopup,
        handleFetchDataset,
        textSearchInput,
        setTextSearchInput,
        searchType,
        setSearchType,
        password,
        setPassword,
        countries,
        setCountries,
        cities,
        setCities,
        citiesData,
        setCitiesData,
        categories,
        setCategories,
        reqFetchDataset,
        setReqFetchDataset,
        handleCountryCitySelection,
        handleTypeToggle,
        validateFetchDatasetForm,
        resetFetchDatasetForm,
        layerDataMap,
        setLayerDataMap,
        selectedCountry,
        setSelectedCountry,
        selectedCity,
        setSelectedCity,
        layerStates,
        updateLayerState,
      }}
    >
      {children}
    </LayerContext.Provider>
  );
}

export function useLayerContext() {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error("useLayerContext must be used within a LayerProvider");
  }
  return context;
}
