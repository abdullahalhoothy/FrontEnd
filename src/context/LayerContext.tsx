// src/context/LayerContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
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
  Insights,
} from '../types/allTypesAndInterfaces';
import urls from '../urls.json';
import { useCatalogContext } from './CatalogContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { processCityData, getDefaultLayerColor, colorOptions } from '../utils/helperFunctions';
import apiRequest from '../services/apiRequest';
import { defaultMapConfig } from '../hooks/map/useMapInitialization';
import { useMapContext } from './MapContext';
import { isIntelligentLayer } from '../utils/layerUtils';
import { mapZoomToFakeDataZoom } from '../utils/mapZoomUtils';
import _ from 'lodash';

const FAKE_IS_ENABLED = true;

const getFakeData = async (zoomLevel: number) => {
  const url = `/data/population_json_files/v${zoomLevel}/all_features.json`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error('Response status:', response.status);
    console.error('Response text:', await response.text());
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  const fakeData = await response.json();
  return fakeData;
};

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider(props: { children: ReactNode }) {
  const navigate = useNavigate();
  const { authResponse } = useAuth();
  const { children } = props;
  const { geoPoints, setGeoPoints } = useCatalogContext();
  // State from useLocationAndCategories
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesData, setCitiesData] = useState<{ [country: string]: City[] }>({});
  const [categories, setCategories] = useState<CategoryData>({});
  const [reqFetchDataset, setReqFetchDataset] = useState<ReqFetchDataset>({
    selectedCountry: '',
    selectedCity: '',
    layers: [],
    includedTypes: [],
    excludedTypes: [],
    zoomLevel: defaultMapConfig.zoomLevel,
  });
  const [reqSaveLayer, setReqSaveLayer] = useState({
    legend: '',
    description: '',
    name: '',
  });

  const [createLayerformStage, setCreateLayerformStage] = useState<string>('initial');
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [manyFetchDatasetResp, setManyFetchDatasetResp] = useState<
    FetchDatasetResponse | undefined
  >(undefined);
  const [FetchDatasetResp, setFetchDatasetResp] = useState<FetchDatasetResponse | null>(null);
  const [saveMethod, setSaveMethod] = useState<string>('');
  const [datasetInfo, setDatasetInfo] = useState<{
    bknd_dataset_id: string;
    prdcer_lyr_id: string;
  } | null>(null);

  const [saveResponse, setSaveResponse] = useState<SaveResponse | null>(null);
  const [saveResponseMsg, setSaveResponseMsg] = useState<string>('');
  const [saveReqId, setSaveReqId] = useState<string>('');

  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    hex: string;
  } | null>(null);
  const [saveOption, setSaveOption] = useState<string>('');

  const [centralizeOnce, setCentralizeOnce] = useState<boolean>(false);
  const [initialFlyToDone, setInitialFlyToDone] = useState<boolean>(false);

  const [showLoaderTopup, setShowLoaderTopup] = useState<boolean>(false);

  const [postResMessage, setPostResMessage] = useState<string>('');
  const [postResId, setPostResId] = useState<string>('');

  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [textSearchInput, setTextSearchInput] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('category_search');
  const [password, setPassword] = useState<string>('');

  const pageCountsRef = useRef<{ [layerId: string]: number }>({});

  const [layerDataMap, setLayerDataMap] = useState<LayerDataMap>({});
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  const [layerStates, setLayerStates] = useState<{
    [layerId: number]: LayerState;
  }>({});

  const { mapRef, shouldInitializeFeatures, backendZoom } = useMapContext();
  const { selectedContainerType } = useCatalogContext();

  const currentZoomLevel = useMemo(() => backendZoom ?? defaultMapConfig.zoomLevel, [backendZoom]);

  const [currentViewportInsights, setCurrentViewportInsights] = useState<Insights | any | null>(
    null
  );

  function incrementFormStage() {
    if (createLayerformStage === 'initial') {
      setCreateLayerformStage('secondStep');
    } else if (createLayerformStage === 'secondStep') {
      setCreateLayerformStage('thirdStep');
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
        method: 'post',
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
    setCreateLayerformStage('initial');
  }

  function updateGeoJSONDataset(data: any, layerId: number, layerName: string) {
    setGeoPoints((prevPoints: MapFeatures[] | MapFeatures | any) => {
      const layerKey = String(layerId);

      pageCountsRef.current[layerKey] = (pageCountsRef.current[layerKey] || 0) + 1;

      // Skip merging if response has no features
      if (!data.features?.length) {
        console.warn(`No features in response for layer ${layerId}, skipping...`);
        return prevPoints;
      }

      const existingPoint = prevPoints.find(
        (p: MapFeatures) => String(p.layerId) === String(layerId)
      );

      const newPoint = {
        type: 'FeatureCollection',
        features: [
          ...(existingPoint?.features || []), // Keep existing features if any
          ...data.features.map(f => ({
            type: 'Feature',
            geometry: f.geometry,
            properties: f.properties,
            layerId: String(layerId),
          })),
        ],
        display: true,
        points_color: existingPoint?.points_color || getDefaultLayerColor(layerId),
        layerId: String(layerId),
        city_name: reqFetchDataset.selectedCity,
        layer_legend: layerName,
        prdcer_layer_name: layerName,
        prdcer_lyr_id: data.prdcer_lyr_id,
        bknd_dataset_id: data.bknd_dataset_id,
      };

      const filteredPoints = prevPoints.filter(p => String(p.layerId) !== String(layerId));
      const newPoints = [...filteredPoints, newPoint];

      if (data.next_page_token) {
        fetchAllPagesForLayer(layerId, layerName, data.next_page_token, data.prdcer_lyr_id).catch(
          err => {
            console.error(`Error fetching page for layer ${layerId}:`, err);
          }
        );
      } else {
        delete pageCountsRef.current[layerKey];
      }

      return newPoints;
    });
  }
  //To be removed after fixed on backend
  function assignPopularityCategory(json: any): void {
    let features = json.features;

    // Extract popularity scores
    let scores = features.map(f => f.properties.popularity_score);

    // Compute percentiles
    scores.sort((a, b) => b - a);
    let quartile = Math.ceil(scores.length / 4);

    let thresholds = {
      very_high: scores[quartile - 1] || 0,
      high: scores[2 * quartile - 1] || 0,
      mid: scores[3 * quartile - 1] || 0,
    };

    // Assign categories
    features.forEach(feature => {
      if (!feature.properties.popularity_score_category) {
        let score = feature.properties.popularity_score;
        if (score >= thresholds.very_high) {
          feature.properties.popularity_score_category = 'very high';
        } else if (score >= thresholds.high) {
          feature.properties.popularity_score_category = 'high';
        } else if (score >= thresholds.mid) {
          feature.properties.popularity_score_category = 'mid';
        } else {
          feature.properties.popularity_score_category = 'low';
        }
      }
    });
  }

  const layerDataMapRef = useRef<LayerDataMap>({});
  useEffect(() => {
    layerDataMapRef.current = layerDataMap;
  }, [layerDataMap]);

  async function handleFetchDataset(
    action: string,
    pageToken?: string,
    layerId?: number,
    prevPrdcerLyrId?: string,
    customBody?: any
  ) {
    if (!pageToken && !layerId) {
      setGeoPoints(prev => prev.filter(p => isIntelligentLayer(p)));
      setLayerDataMap({});
    }

    let user_id: string;
    let idToken: string;

    try {
      if (authResponse && 'idToken' in authResponse) {
        user_id = authResponse.localId;
        idToken = authResponse.idToken;
      } else if (action == 'full data') {
        navigate('/auth');
        setIsError(new Error('User is not authenticated!'));
        return;
      } else {
        user_id = '0000';
        idToken = '';
      }

      const layers = layerId
        ? [reqFetchDataset.layers.find(l => l.id === layerId)]
        : reqFetchDataset.layers;

      setReqFetchDataset(prev => ({
        ...prev,
        action: action,
      }));
      if (searchType !== 'keyword_search') {
        for (const layer of layers) {
          try {
            if (!layer) continue;

            if (layerDataMap[layer.id]) {
              console.warn(`Layer ${layer.id} already processed, skipping...`);
              continue;
            }

            const defaultName = `${reqFetchDataset.selectedCountry} ${reqFetchDataset.selectedCity} ${
              layer.includedTypes?.map(type => type.replace('_', ' ')).join(' + ') || ''
            }${
              layer.excludedTypes?.length > 0
                ? ' + not ' +
                  layer.excludedTypes.map(type => type.replace('_', ' ')).join(' + not ')
                : ''
            }`;

            const prdcerLayerId = layerDataMapRef.current[layer.id]?.prdcer_lyr_id;
            const payloadLayerId = pageToken
              ? prevPrdcerLyrId || layerDataMapRef.current[layer.id]?.prdcer_lyr_id || ''
              : '';

            const res = await apiRequest({
              url: urls.fetch_dataset,
              method: 'post',
              body: {
                country_name: reqFetchDataset.selectedCountry,
                city_name: reqFetchDataset.selectedCity,
                boolean_query: layer.includedTypes?.join(' OR '),
                layerId: payloadLayerId,
                layer_name: defaultName,
                action: action,
                search_type: searchType,
                text_search: textSearchInput?.trim() || '',
                page_token: pageToken || '',
                user_id: user_id,
                zoom_level: currentZoomLevel,
              },
              isAuthRequest: true,
            });
            if (res?.data?.data) {
              await assignPopularityCategory(res?.data?.data); //To be removed after fixed on backend
              setLayerDataMap(prev => ({
                ...prev,
                [layer.id]: res.data.data,
              }));

              updateGeoJSONDataset(res.data.data, layer.id, defaultName);
            }
          } catch (error) {
            console.error(`Error fetching layer ${layer?.id}:`, error);
            if (error?.response?.data?.detail === 'Insufficient balance in wallet') {
              resetFormStage();
              setShowErrorMessage(true);
              return;
            }
            setIsError(error instanceof Error ? error : new Error(String(error)));
            // Re-throw to propagate it upward:
            throw error;
          }
        }
      } else {
        let defaultName = `${reqFetchDataset.selectedCountry} ${reqFetchDataset.selectedCity} ${textSearchInput?.trim()}`;
        const res = await apiRequest({
          url: urls.fetch_dataset,
          method: 'post',
          body: {
            country_name: reqFetchDataset.selectedCountry,
            city_name: reqFetchDataset.selectedCity,
            boolean_query: '',
            layerId: payloadLayerId,
            layer_name: defaultName,
            action: action,
            search_type: searchType,
            text_search: textSearchInput?.trim(),
            page_token: pageToken || '',
            user_id: user_id,
            zoom_level: currentZoomLevel,
          },
          isAuthRequest: true,
        });
        if (res?.data?.data) {
          await assignPopularityCategory(res?.data?.data); //To be removed after fixed on backend
          setLayerDataMap(prev => ({
            ...prev,
            [1]: res.data.data,
          }));
          let layers = [
            {
              id: 1,
              name: textSearchInput?.trim(),
              points_color: '',
              excludedTypes: [],
              includedTypes: [textSearchInput?.trim()],
            },
          ];
          updateGeoJSONDataset(res.data.data, 1, defaultName);
          setReqFetchDataset(prev => ({
            ...prev,
            layers: layers,
          }));
        }
      }

      if (!!customBody) {
        try {
          // Set the country and city directly
          const countryName = customBody.country_name || customBody.selectedCountry;
          const cityName = customBody.city_name || customBody.selectedCity;
          setSelectedCountry(countryName);
          setSelectedCity(cityName);

          // Extract layer name and other properties from customBody
          const defaultName =
            customBody.layer_name ||
            `${customBody.city_name || customBody.selectedCity} ${_.upperFirst(customBody.boolean_query)}`;

          // If this is coming from the LLM, we need to prepare the body for the fetch_dataset endpoint
          const fetchBody = {
            user_id: authResponse?.localId,
            city_name: customBody.city_name || customBody.selectedCity,
            country_name: customBody.country_name || customBody.selectedCountry,
            boolean_query: customBody.boolean_query || '',
            action: action || customBody.action || 'sample',
            search_type: customBody.search_type || 'category_search',
            zoom_level: backendZoom || defaultMapConfig.zoomLevel,
            ...customBody,
          };

          // Add this line to log the page token
          if (pageToken) {
            fetchBody.page_token = pageToken;
          }

          const res = await apiRequest({
            url: urls.fetch_dataset,
            method: 'post',
            body: fetchBody,
            isAuthRequest: true,
          });

          if (res?.data?.data) {
            await assignPopularityCategory(res?.data?.data);

            // Update layer data map
            setLayerDataMap(prev => ({
              ...prev,
              1002: res.data.data,
            }));

            // Create a proper layer configuration
            let layers = [
              {
                id: 1002,
                name: defaultName,
                points_color: customBody.points_color || getDefaultLayerColor(1002),
                excludedTypes: customBody.excludedTypes || [],
                includedTypes: customBody.boolean_query
                  ? [customBody.boolean_query]
                  : customBody.includedTypes || [],
              },
            ];

            setReqFetchDataset(prev => ({
              ...prev,
              layers: layers,
              selectedCity: customBody.city_name || customBody.selectedCity || prev.selectedCity,
              selectedCountry: customBody.country_name || prev.selectedCountry,
            }));

            updateGeoJSONDataset(res.data.data, 1002, defaultName);

            if (action === 'full data' || customBody.action === 'full data') {
              setCentralizeOnce(true);
            }

            incrementFormStage();

            // For full data, we handle pagination
            if (
              (action === 'full data' || customBody.action === 'full data') &&
              res.data.data.next_page_token &&
              !pageToken // Only call fetchAllPages if this is the initial request
            ) {
              fetchAllPages(1002, res.data.data.next_page_token, customBody);
            }

            return res.data.data;
          }
        } catch (error) {
          console.error(`Error fetching custom layer`, error);
          setIsError(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      }
    } catch (error) {
      setIsError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setShowLoaderTopup(false);
    }
  }

  async function fetchAllPages(layerId: number, initialPageToken: string, customBody?: any) {
    let pageToken = initialPageToken;
    let prevPrdcerLyrId = '';

    while (pageToken) {
      const resData = await handleFetchDataset(
        'full data',
        pageToken,
        layerId,
        prevPrdcerLyrId,
        customBody
      );

      if (!resData) {
        console.log('No data returned, stopping pagination');
        break;
      }

      // Use the prdcer_lyr_id from the current response for the next call
      prevPrdcerLyrId = resData.prdcer_lyr_id;

      pageToken = resData.next_page_token || '';
    }
  }

  async function fetchAllPagesForLayer(
    layerId: number,
    defaultName: string,
    initialPageToken: string,
    initialPrdcerLyrId: string
  ) {
    let pageToken = initialPageToken;
    let prevPrdcerLyrId = initialPrdcerLyrId;
    // Loop until there is no pageToken
    while (pageToken) {
      // Await each API call and get its response data
      const resData = await handleFetchDataset('full data', pageToken, layerId, prevPrdcerLyrId);
      if (!resData) break;
      // Use the prdcer_lyr_id from the current response for the next call
      prevPrdcerLyrId = resData.prdcer_lyr_id;
      pageToken = resData.next_page_token || '';
    }
  }

  async function handleGetCountryCityCategory() {
    try {
      const res = await apiRequest({
        url: urls.country_city,
        method: 'get',
      });
      setCountries(processCityData(res.data.data, setCitiesData));
    } catch (error) {
      setIsError(error);
    }

    try {
      const res = await apiRequest({
        url: urls.nearby_categories,
        method: 'get',
      });
      setCategories(res.data.data);
    } catch (error) {
      setIsError(error);
    }
  }

  function handleCountryCitySelection(event: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = event.target;

    if (name === 'selectedCountry') {
      // Update country and reset city
      setSelectedCountry(value);
      setSelectedCity('');

      // Reset area intelligence
      setIncludePopulation(false);

      // Get cities for selected country
      const selectedCountryCities = citiesData[value] || [];
      setCities(selectedCountryCities);

      // Update reqFetchDataset
      setReqFetchDataset(prev => ({
        ...prev,
        selectedCountry: value,
        selectedCity: '', // Reset city when country changes
      }));
    } else if (name === 'selectedCity') {
      setSelectedCity(value);

      setReqFetchDataset(prev => ({
        ...prev,
        selectedCity: value,
      }));
    }
  }

  function handleTypeToggle(type: string) {
    setReqFetchDataset(prevData => {
      if (prevData.includedTypes.includes(type)) {
        return {
          ...prevData,
          includedTypes: prevData.includedTypes.filter(t => t !== type),
          excludedTypes: [...prevData.excludedTypes, type],
        };
      } else if (prevData.excludedTypes.includes(type)) {
        return {
          ...prevData,
          excludedTypes: prevData.excludedTypes.filter(t => t !== type),
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
      return new Error('Country and city are required.');
    }
    if (
      reqFetchDataset.includedTypes.length === 0 &&
      reqFetchDataset.excludedTypes.length === 0 &&
      searchType !== 'keyword_search'
    ) {
      console.log(
        'At least one category must be included or excluded.',
        reqFetchDataset,
        searchType
      );
      return new Error('At least one category must be included or excluded.');
    }
    if (reqFetchDataset.includedTypes.length > 50 || reqFetchDataset.excludedTypes.length > 50) {
      return new Error('Up to 50 types can be specified in each type restriction category.');
    }
    return true;
  }

  useEffect(() => {
    console.log('searchType', searchType);
  }, [searchType]);

  function resetFetchDatasetForm() {
    setReqFetchDataset({
      selectedCountry: '',
      selectedCity: '',
      layers: [],
      includedTypes: [],
      excludedTypes: [],
      zoomLevel: defaultMapConfig.zoomLevel,
    });
    setLayerDataMap({});
    setSelectedCountry('');
    setSelectedCity('');
    setIncludePopulation(false);
    setTextSearchInput('');
    setSearchType('category_search');
    setPassword('');
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
        ...updates,
      },
    }));
  };

  useEffect(() => {
    if (reqFetchDataset?.layers?.length > 0) {
      // Initialize layer states while preserving existing states
      setLayerStates(prev => {
        const initialStates = reqFetchDataset.layers.reduce(
          (acc, layer) => {
            if (layer && typeof layer.id === 'number') {
              acc[layer.id] = {
                ...prev[layer.id], // Preserve existing state if any
                selectedColor: prev[layer.id]?.selectedColor || null,
                isLoading: false, // Reset loading state
                saveResponse: prev[layer.id]?.saveResponse || null,
                datasetInfo: prev[layer.id]?.datasetInfo || null,
              };
            }
            return acc;
          },
          {} as { [key: number]: LayerState }
        );

        return initialStates;
      });
    }
  }, [reqFetchDataset?.layers]);

  // Add zoom level effect to trigger refetch for all grid population layers
  useEffect(() => {
    // Only refetch if we have existing population grid layers
    const gridLayers = geoPoints.filter(point => point.is_grid && point.is_intelligent);
    if (gridLayers.length > 0) {
      refetchPopulationLayer();
    }
  }, [currentZoomLevel]);

  useEffect(() => {
    handlePopulationLayer(false);
  }, [selectedContainerType]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      fetchPopulationByViewport();
      map.on('moveend', fetchPopulationByViewport);
      return () => {
        map.off('moveend', fetchPopulationByViewport);
      };
    }
  }, [currentZoomLevel, mapRef.current]);

  const [includePopulation, setIncludePopulation] = useState(false);

  async function switchPopulationLayer() {
    const shouldInclude = !includePopulation;
    handlePopulationLayer(shouldInclude);
  }

  async function refetchPopulationLayer() {
    await handlePopulationLayer(false);
    await handlePopulationLayer(true, true);
  }

  async function handlePopulationLayer(shouldInclude: boolean, isRefetch: boolean = false) {
    const map = mapRef.current;

    if (!shouldInitializeFeatures || !map) {
      console.warn('Map not initialized');
      return;
    }

    const waitForMapReady = () =>
      new Promise<void>(resolve => {
        if (map.isStyleLoaded() && !map.isMoving()) {
          resolve();
          return;
        }

        const checkMapReady = () => {
          if (map.isStyleLoaded() && !map.isMoving()) {
            map.off('idle', checkMapReady);
            map.off('render', checkMapReady);
            resolve();
          }
        };

        map.on('idle', checkMapReady);
        map.on('render', checkMapReady);

        // Timeout after 5 seconds
        setTimeout(() => {
          map.off('idle', checkMapReady);
          map.off('render', checkMapReady);
          resolve(); // Proceed anyway after timeout
        }, 5000);
      });

    try {
      await waitForMapReady();

      // Check authentication
      if (!authResponse?.localId || !authResponse?.idToken) {
        const message = 'Authentication required. Please log in to use this feature.';
        console.error(message);
        setIsError(new Error(message));
        setShowLoaderTopup(false);
        return;
      }

      // Check city/country selection
      if (shouldInclude && (!selectedCity || !selectedCountry)) {
        const message = 'Please select a city and country first.';
        console.error(message, { selectedCity, selectedCountry });
        setIsError(new Error(message));
        setShowLoaderTopup(false);
        return;
      }

      setIncludePopulation(shouldInclude);

      if (shouldInclude) {
        setShowLoaderTopup(true);
        try {
          let res: any;
          const shouldFake = FAKE_IS_ENABLED && selectedCountry.toLowerCase() == 'saudi arabia';

          if (shouldFake) {
            const fakeZoomLevel = mapZoomToFakeDataZoom(currentZoomLevel);
            const fakeData = await getFakeData(fakeZoomLevel);
            res = { data: { data: fakeData } };
          } else {
            res = await apiRequest({
              url: urls.fetch_dataset,
              method: 'post',
              body: {
                text_search: '',
                page_token: '',
                user_id: authResponse.localId,
                idToken: authResponse.idToken,
                zoom_level: currentZoomLevel,
                country_name: selectedCountry,
                city_name: selectedCity,
                boolean_query: 'TotalPopulation',
                layer_name: 'Population Layer',
                action: 'sample',
                search_type: 'category_search',
              },
              isAuthRequest: true,
              useCache: true,
            });

            if (!res?.data?.data) {
              throw new Error('Invalid response data');
            }
          }
          console.log('res', res);
          setGeoPoints(prevPoints => {
            const populationLayer = {
              layerId: 1001, // Special ID for population layer
              type: 'FeatureCollection',
              features: res.data.data?.features,
              display: true,
              points_color: colorOptions[0].hex,
              city_name: selectedCity,
              layer_legend: `${selectedCity} Population Layer (${res.data.data?.features?.length})`,
              is_grid: true,
              is_intelligent: true,
              is_fake: shouldFake,
              is_refetch: isRefetch,
              basedon: 'population',
              visualization_mode: 'grid',
            };

            const filteredPoints = prevPoints.filter(
              point => point.layerId !== populationLayer.layerId
            );
            return [...filteredPoints, populationLayer];
          });

          // Update layer data map
          setLayerDataMap(prev => ({
            ...prev,
            1001: res.data.data,
          }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch population data';
          console.error('Population layer error:', error);
          setIsError(new Error(message));
        } finally {
          setShowLoaderTopup(false);
        }
      } else {
        // Remove population layer
        setGeoPoints(prev => prev.filter(point => !point.is_intelligent));

        // Clean up layer data map
        setLayerDataMap(prev => {
          const newMap = { ...prev };
          delete newMap[1001];
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error updating population layer:', error);
      setIsError(new Error('Failed to update population layer'));
      setShowLoaderTopup(false);
    }
  }

  const handleSubmitFetchDataset = (
    action: string,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (event) event.preventDefault();

    const result = validateFetchDatasetForm();

    if (result === true) {
      if (action === 'full data') {
        setCentralizeOnce(true);
      }
      setShowLoaderTopup(true);
      handleFetchDataset(action);
      incrementFormStage();
      return true;
    } else if (result instanceof Error) {
      return result;
    }
    return false;
  };

  function calculateInsights(features: any) {
    if (features.length === 0) return null;

    // Initialize aggregation variables
    let totalPopulation = 0;
    let totalMalePopulation = 0;
    let totalFemalePopulation = 0;
    let medianAgesTotal: number[] = [];
    let medianAgesFemale: number[] = [];
    let densityValues: number[] = [];

    // Collect data for aggregation
    for (const feature of features) {
      const props = feature.properties;

      totalPopulation += props.Population_Count;
      totalMalePopulation += props.Male_Population;
      totalFemalePopulation += props.Female_Population;
      medianAgesTotal.push(props.Median_Age_Total);
      medianAgesFemale.push(props.Median_Age_Female); // Collect female median ages
      densityValues.push(props.Population_Density_KM2);
    }

    // Calculate median of Median_Age_Total
    medianAgesTotal.sort((a, b) => a - b);
    const medianOfMedianAgesTotal =
      medianAgesTotal.length > 0
        ? medianAgesTotal.length % 2 === 0
          ? (medianAgesTotal[medianAgesTotal.length / 2 - 1] +
              medianAgesTotal[medianAgesTotal.length / 2]) /
            2
          : medianAgesTotal[Math.floor(medianAgesTotal.length / 2)]
        : 0;

    // Calculate median of Median_Age_Female
    medianAgesFemale.sort((a, b) => a - b);
    const medianOfMedianAgesFemale =
      medianAgesFemale.length > 0
        ? medianAgesFemale.length % 2 === 0
          ? (medianAgesFemale[medianAgesFemale.length / 2 - 1] +
              medianAgesFemale[medianAgesFemale.length / 2]) /
            2
          : medianAgesFemale[Math.floor(medianAgesFemale.length / 2)]
        : 0;

    // Calculate median of population densities
    densityValues.sort((a, b) => a - b);
    const medianDensity =
      densityValues.length > 0
        ? densityValues.length % 2 === 0
          ? (densityValues[densityValues.length / 2 - 1] +
              densityValues[densityValues.length / 2]) /
            2
          : densityValues[Math.floor(densityValues.length / 2)]
        : 0;

    // Calculate average density (simple average)
    const avgDensity =
      densityValues.length > 0
        ? densityValues.reduce((sum, value) => sum + value, 0) / densityValues.length
        : 0;

    // Calculate female population percentage
    const femalePercentage =
      totalPopulation > 0 ? (totalFemalePopulation / totalPopulation) * 100 : 0;
    const malePercentage = totalPopulation > 0 ? (totalMalePopulation / totalPopulation) * 100 : 0;

    return {
      population: {
        total: totalPopulation,
        male: totalMalePopulation,
        female: totalFemalePopulation,
        femalePercentage: parseFloat(femalePercentage.toFixed(2)),
        malePercentage: parseFloat(malePercentage.toFixed(2)),
      },
      populationDensity: {
        average: parseFloat(avgDensity.toFixed(2)),
        median: parseFloat(medianDensity.toFixed(2)),
      },
      age: {
        medianOfMediansTotal: parseFloat(medianOfMedianAgesTotal.toFixed(1)),
        medianOfMediansFemale: parseFloat(medianOfMedianAgesFemale.toFixed(1)), // Add female median age
      },
      featureCount: features.length,
    };
  }

  const fetchPopulationByViewport = useCallback(async (): Promise<void> => {
    const map = mapRef.current;
    if (!map) {
      console.warn('Map not initialized');
      return;
    }
    const bounds = map.getBounds();
    const reqBody = {
      min_lng: bounds.getWest(),
      min_lat: bounds.getSouth(),
      max_lng: bounds.getEast(),
      max_lat: bounds.getNorth(),
      population: true,
      income: true,
      zoom_level: 7 + currentZoomLevel,
      user_id: authResponse?.localId,
    };
    const res = await apiRequest({
      url: urls.fetch_population_by_viewport,
      method: 'post',
      body: reqBody,
      isAuthRequest: true,
    });
    if (!res.data.data) {
      throw new Error('No data returned for current viewport');
    }
    const features = res.data.data.features;
    const insights = calculateInsights(features);
    setCurrentViewportInsights(insights);
    return;
  }, [currentZoomLevel, mapRef.current]);

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
        showErrorMessage,
        setShowErrorMessage,
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
        includePopulation,
        setIncludePopulation,
        handlePopulationLayer,
        switchPopulationLayer,
        refetchPopulationLayer,
        handleSubmitFetchDataset,
        currentViewportInsights,
      }}
    >
      {children}
    </LayerContext.Provider>
  );
}

export function useLayerContext() {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider');
  }
  return context;
}
