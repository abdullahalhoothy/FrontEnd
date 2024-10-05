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
} from "../types/allTypesAndInterfaces";
import urls from "../urls.json";
import { useCatalogContext } from "./CatalogContext";
import userIdData from "../currentUserId.json";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { processCityData } from "../utils/helperFunctions";
import apiRequest from "../services/apiRequest";

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider(props: { children: ReactNode }) {
  const navigate = useNavigate();
  const { authResponse } = useAuth(); // Add this line
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
    includedTypes: [],
    excludedTypes: [],
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
  const [searchType, setSearchType] = useState<string>("new nearby search");
  const [password, setPassword] = useState<string>("");

  const callCountRef = useRef<number>(0);
  const MAX_CALLS = 10;

  function incrementFormStage() {
    if (createLayerformStage === "initial") {
      setCreateLayerformStage("secondStep");
    } else if (createLayerformStage === "secondStep") {
      setCreateLayerformStage("thirdStep");
    }
  }

  async function handleSaveLayer(reqSaveLayer) {
    if (!authResponse || !("idToken" in authResponse)) {
      navigate("/auth");
      setIsError(new Error("User is not authenticated!"));
      return;
    }

    if (!datasetInfo) {
      setIsError(new Error("Dataset information is missing!"));
      console.error("Dataset information is missing!");
      return;
    }

    if (!selectedColor) {
      setIsError(new Error("Selected color is missing!"));
      console.error("Selected color is missing!");
      return;
    }

    const userId = userIdData.user_id;

    const postData = {
      prdcer_layer_name: reqSaveLayer.name,
      prdcer_lyr_id: datasetInfo.prdcer_lyr_id,
      bknd_dataset_id: datasetInfo.bknd_dataset_id,
      points_color: selectedColor.hex,
      layer_legend: reqSaveLayer.legend,
      layer_description: reqSaveLayer.description,
      user_id: authResponse.localId,
    };

    setLoading(true);

    // HttpReq<SaveResponse>(
    //   urls.save_layer,
    //   setSaveResponse,
    //   setSaveResponseMsg,
    //   setSaveReqId,
    //   setLoading,
    //   setIsError,
    //   "post",
    //   postData,
    //   authResponse.idToken
    // );

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
      setIsError(error);
    } finally {
      setLoading(false);
    }

    setTimeout(() => {
      resetFormStage();
      setSaveResponse(null);
      resetFetchDatasetForm();
    }, 1000);
  }

  function resetFormStage() {
    setIsError(null);
    setCreateLayerformStage("initial");
  }

  function updateGeoJSONDataset(response: FetchDatasetResponse) {
    // Validate input to ensure it's a valid GeoJSON object
    if (
      !response ||
      typeof response !== "object" ||
      !Array.isArray(response.features)
    ) {
      setIsError(new Error("Input data is not a valid GeoJSON object."));
      return;
    }
    // Update the accumulated dataset response, merging new features with existing ones
    setManyFetchDatasetResp(function (prevResponse) {
      if (prevResponse && typeof prevResponse !== "string") {
        return {
          ...prevResponse,
          features: [...prevResponse.features, ...response.features],
        };
      }
      return {
        ...response,
        features: response.features,
      };
    });
    // Add the new GeoJSON data to the list of geo points for display
    setGeoPoints(function (prevGeoPoints) {
      return [
        ...prevGeoPoints,
        {
          ...response,
          features: response.features,
          display: true,
          points_color: "#28A745",
        },
      ];
    });
    setSelectedColor({
      name: "Green",
      hex: "#28A745",
    });
    // Update dataset info if backend IDs are provided
    if (response.bknd_dataset_id && response.prdcer_lyr_id) {
      setDatasetInfo({
        bknd_dataset_id: response.bknd_dataset_id,
        prdcer_lyr_id: response.prdcer_lyr_id,
      });
    }
    // Handle pagination by initiating a new fetch if a next page token exists
    // and the maximum call limit hasn't been reached
    if (response.next_page_token && callCountRef.current < MAX_CALLS) {
      handleFetchDataset("full data", response.next_page_token);
    } else {
      setShowLoaderTopup(false);
      callCountRef.current = 0;
    }
  }

  async function handleFetchDataset(action: string, pageToken?: string) {
    let user_id: string;
    let idToken: string;

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

    const postData = {
      dataset_country: reqFetchDataset.selectedCountry,
      dataset_city: reqFetchDataset.selectedCity,
      includedTypes: reqFetchDataset.includedTypes,
      excludedTypes: reqFetchDataset.excludedTypes,
      action: action,
      search_type: searchType,
      ...(searchType === "text search" && {
        text_search_input: textSearchInput.trim(),
      }),
      ...(action === "full data" && { password: password }),
      ...(pageToken && { page_token: pageToken }),
      user_id: user_id,
    };

    if (callCountRef.current >= MAX_CALLS) {
      setShowLoaderTopup(false);
      callCountRef.current = 0;
      return;
    }

    callCountRef.current++;

    // HttpReq<FetchDatasetResponse>(
    //   urls.fetch_dataset,
    //   setFetchDatasetResp,
    //   setPostResMessage,
    //   setPostResId,
    //   setLocalLoading,
    //   setIsError,
    //   "post",
    //   postData,
    //   idToken
    // );
    setLocalLoading(true);
    try {
      const res = await apiRequest({
        url: urls.fetch_dataset,
        method: "post",
        body: postData,
        isAuthRequest: true,
      });
      setFetchDatasetResp(res.data.data);
      setPostResMessage(res.data.message);
      setPostResId(res.data.id);
    } catch (error) {
      setIsError(error);
    } finally {
      setLocalLoading(false);
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
    const { name: changed_select_element, value } = event.target;

    // Update the reqFetchDataset state using the functional update form
    setReqFetchDataset((prevData) => ({
      ...prevData, // Spread the previous state
      [changed_select_element]: value, // Update the field corresponding to the changed select element
    }));

    // Check if the changed select element is the country selector
    if (changed_select_element === "selectedCountry") {
      // Get the cities for the selected country from the citiesData object
      // If the country has no cities, use an empty array
      const selectedCountryCities = citiesData[value] || [];

      // Update the cities state with the new list of cities
      setCities(selectedCountryCities);

      // Reset the selected city in the reqFetchDataset state
      setReqFetchDataset((prevData) => ({
        ...prevData, // Spread the previous state
        selectedCity: "", // Clear the selected city
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
      reqFetchDataset.excludedTypes.length === 0
    ) {
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

  function resetFetchDatasetForm() {
    // Reset form data when component unmounts
    setReqFetchDataset({
      selectedCountry: "",
      selectedCity: "",
      includedTypes: [],
      excludedTypes: [],
    });
    setTextSearchInput("");
    setSearchType("new nearby search");
    setPassword("");
    setGeoPoints([]);
  }

  useEffect(
    function () {
      if (isError) {
        setShowLoaderTopup(false);
        callCountRef.current = 0;
      }
    },
    [isError]
  );
  useEffect(
    function () {
      if (FetchDatasetResp) {
        updateGeoJSONDataset(FetchDatasetResp);
      }
    },
    [FetchDatasetResp]
  );

  useEffect(() => {
    handleGetCountryCityCategory();
  }, []);

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
