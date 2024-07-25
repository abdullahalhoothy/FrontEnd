import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import {
  CatalogContextType,
  MapFeatures,
  Feature,
  SaveResponse,
} from "../types/allTypesAndInterfaces";
import { HttpReq } from "../services/apiService";
import urls from "../urls.json";
import userIdData from "../currentUserId.json";
import { colorOptions, isValidColor } from "../utils/helperFunctions";

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider(props: { children: ReactNode }) {
  const { children } = props;

  const [formStage, setFormStage] = useState("catalogue");
  const [saveMethod, setSaveMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [legendList, setLegendList] = useState<string[]>([]);
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [selectedContainerType, setSelectedContainerType] = useState<
    "Catalogue" | "Layer" | "Home"
  >("Home");

  const [geoPoints, setGeoPoints] = useState<MapFeatures | string>("");
  const [tempGeoPointsList, setTempGeoPointsList] = useState<MapFeatures[]>([]);
  const [lastGeoIdRequest, setLastGeoIdRequest] = useState<
    string | undefined
  >();
  const [lastGeoMessageRequest, setLastGeoMessageRequest] = useState<
    string | undefined
  >();
  const [lastGeoError, setLastGeoError] = useState<Error | null>(null);
  const [idColors, setIdColors] = useState<Record<string, string>>({});

  const [selectedColor, setSelectedColor] = useState<string>("red");
  const [selectedLayers, setSelectedLayers] = useState<
    {
      name: string;
      id: string;
      color: string;
      is_zone_lyr: boolean;
      display: boolean;
      legend?: string;
    }[]
  >([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );

  const [saveResponse, setSaveResponse] = useState<SaveResponse | null>(null);
  const [saveResponseMsg, setSaveResponseMsg] = useState("");
  const [saveReqId, setSaveReqId] = useState("");

  const colorIndexRef = useRef(Object.keys(idColors).length);

  function handleError(error: Error | null) {
    setLastGeoError(error ?? null);
  }


  function processFeatureCollection(
    item: MapFeatures,
    id: string,
    color: string
  ): MapFeatures {
    return {
      ...item,
      features: item.features.map(function (feature) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            geoPointId: id,
            color: color, // Assign color to the feature properties
          },
        };
      }),
    };
  }

  function processData(
    data: MapFeatures | MapFeatures[],
    id: string,
    color: string
  ): MapFeatures[] {
    if (Array.isArray(data)) {
      return data
        .filter(function (item) {
          return item && item.features;
        })
        .map(function (item) {
          return processFeatureCollection(item, id, color);
        });
    } else if (data && data.features) {
      return [processFeatureCollection(data, id, color)];
    }
    return [];
  }

  // Function to handle adding a new layer or catalog item
  function handleAddClick(
    id: string,
    name: string,
    typeOfCard: string,
    existingColor?: string,
    legend?: string,
    layers?: { layer_id: string; points_color: string }[]
  ) {
    if (typeOfCard === "userCatalog" && layers) {
      layers.forEach(function (layer) {
        const newColor = isValidColor(layer.points_color)
          ? layer.points_color
          : existingColor ||
            colorOptions[colorIndexRef.current % colorOptions.length];

        colorIndexRef.current += 1;

        setSelectedLayers(function (prevLayers) {
          return [
            ...prevLayers,
            {
              name,
              id: layer.layer_id,
              color: newColor,
              is_zone_lyr: false,
              display: true,
              legend: legend || "",
            },
          ];
        });

        fetchGeoPoints(layer.layer_id, "layer", newColor);
      });
    } else {
      const newColor =
        existingColor ||
        colorOptions[colorIndexRef.current % colorOptions.length];

      colorIndexRef.current += 1;

      setSelectedLayers(function (prevLayers) {
        return [
          ...prevLayers,
          {
            name,
            id,
            color: newColor,
            is_zone_lyr: typeOfCard === "layer",
            display: true,
            legend: legend || "",
          },
        ];
      });

      fetchGeoPoints(id, typeOfCard, newColor);
    }
  }

  function updateLayerDisplay(layerIndex: number, display: boolean) {
    setSelectedLayers(function (prevLayers) {
      const updatedLayers = [...prevLayers];
      updatedLayers[layerIndex].display = display;
      return updatedLayers;
    });
  }

  // This function combines multiple FeatureCollection objects into one, assigning colors based on selectedLayers and adding properties like color and geoPointId to each feature.
  function mergeFeatures(featuresList: MapFeatures[]): MapFeatures {
    const mergedFeatures = featuresList.reduce(function (
      acc,
      featureCollection
    ) {
      const filteredFeatures = featureCollection.features
        .map(function (feature) {
          const id = feature.properties.geoPointId;
          const matchedLayer = selectedLayers.find(function (layer) {
            return layer.id === id;
          });
          const color = matchedLayer ? matchedLayer.color : "defaultColor"; // Assigning color based on matched layer. This ensures each feature is visually distinct on the map.
          const display = matchedLayer ? matchedLayer.display : true;

          if (!display) return null; // Skip the feature if display is false

          return {
            ...feature,
            properties: {
              ...feature.properties,
              color, // This color property is mandatory for Mapbox to style each feature. Each feature's properties must include a color key.
              geoPointId: id, // This ID is needed to group related points together, ensuring each feature is correctly associated with its layer, if the color of one change, all of them will change together
            },
          };
        })
        .filter(function (feature): feature is Feature {
          return feature !== null;
        }); // Filter out null values

      return acc.concat(filteredFeatures);
    },
    [] as Feature[]);

    return {
      type: "FeatureCollection",
      features: mergedFeatures,
    };
  }

  // Effect to update geoPoints when tempGeoPointsList or selectedLayers change
  useEffect(
    function () {
      if (tempGeoPointsList.length > 0) {
        const mergedGeoPoints = mergeFeatures(tempGeoPointsList);
        setGeoPoints(mergedGeoPoints);
      } else {
        setGeoPoints("");
      }
    },
    [tempGeoPointsList, selectedLayers]
  );

  // Function to fetch geo points for a layer or catalog item
  async function fetchGeoPoints(id: string, typeOfCard: string, color: string) {
    const apiJsonRequest =
      typeOfCard === "layer"
        ? {
            prdcer_lyr_id: id,
            user_id: userIdData.user_id,
          }
        : typeOfCard === "userCatalog"
        ? { prdcer_ctlg_id: id, as_layers: true, user_id: userIdData.user_id }
        : { catalogue_dataset_id: id };

    const url =
      typeOfCard === "layer"
        ? urls.prdcer_lyr_map_data
        : typeOfCard === "userCatalog"
        ? urls.fetch_ctlg_lyrs
        : urls.http_catlog_data;

    await HttpReq<MapFeatures | MapFeatures[]>(
      url,
      function (data) {
        const updatedDataArray = processData(data, id, color);

        setTempGeoPointsList(function (prevList) {
          return [...prevList, ...updatedDataArray];
        });
      },
      setLastGeoMessageRequest,
      setLastGeoIdRequest,
      setIsLoading,
      handleError,
      "post",
      apiJsonRequest
    );
  }

  function handleSave() {
  const layersData = selectedLayers.map(function (layer) {
    return {
      layer_id: layer.id,
      points_color: layer.color,
    };
  });

    const requestBody = {
      prdcer_ctlg_name: name,
      subscription_price: subscriptionPrice,
      ctlg_description: description,
      total_records: 0,
      lyrs: layersData,
      user_id: userIdData.user_id,
      thumbnail_url: "",
    };

    HttpReq(
      urls.save_producer_catalog,
      setSaveResponse,
      setSaveResponseMsg,
      setSaveReqId,
      setIsLoading,
      setIsError,
      "post",
      requestBody
    );
  }

  // Function to reset form stage
  function resetFormStage(resetTo: string) {
    setDescription("");
    setName("");
    setSubscriptionPrice(" ");
    setSaveResponse(null);
    setIsError(null);
    setFormStage(resetTo);
  }

  function resetState() {
    setGeoPoints("");
    setSelectedLayers([]);
    setTempGeoPointsList([]);
    setLastGeoIdRequest(undefined);
    setLastGeoMessageRequest(undefined);
    setLastGeoError(null);
  }

  // Function to update the color of a specific layer
  function updateLayerColor(layerIndex: number, newColor: string) {
    setSelectedLayers(function (prevLayers) {
      const updatedLayers = [...prevLayers];
      updatedLayers[layerIndex].color = newColor;
      return updatedLayers;
    });
  }

  // Function to update the zone layer status of a specific layer
  function updateLayerZone(layerIndex: number, isZoneLayer: boolean) {
    setSelectedLayers(function (prevLayers) {
      const updatedLayers = [...prevLayers];
      updatedLayers[layerIndex].is_zone_lyr = isZoneLayer;
      return updatedLayers;
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
        handleSave,
        resetFormStage,
        selectedContainerType,
        setSelectedContainerType,
        geoPoints,
        setGeoPoints,
        selectedColor,
        setSelectedColor,
        selectedLayers,
        setSelectedLayers,
        updateLayerColor,
        updateLayerZone,
        setTempGeoPointsList,
        openDropdownIndex,
        setOpenDropdownIndex,
        updateLayerDisplay,
        resetState,
        saveResponse,
        saveResponseMsg,
        saveReqId,
        setSaveResponse,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

// Hook to use the catalog context
export function useCatalogContext() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalogContext must be used within a CatalogProvider");
  }
  return context;
}
