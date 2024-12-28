import React, { ReactNode } from "react";

export interface ModalProps {
  children: React.ReactNode;
  darkBackground?: boolean;
  isSmaller?: boolean;
}

export interface ExpandableMenuProps {
  children: ReactNode;
}

export interface MultipleLayersSettingProps {
  layerIndex: number;
}

export interface Catalog {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  records_number: number;
  catalog_link: string;
  can_access: boolean;
  prdcer_ctlg_id?: string;
  prdcer_ctlg_name?: string;
  total_records?: number;
  ctlg_description?: string;
  lyrs?: { layer_id: string; points_color: string }[];
}

export interface UserLayer {
  prdcer_lyr_id: string;
  prdcer_layer_name: string;
  points_color?: string;
  layer_legend: string;
  layer_description: string;
  records_count: number;
  is_zone_lyr: boolean;
  city_name?: string;
}

export interface CatalogueCardProps {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  records_number: number;
  can_access: boolean;
  onMoreInfo(): void;
  typeOfCard: string;
}

export interface CustomProperties {
  name: string;
  rating: number;
  user_ratings_total: number;
  [key: string]: string | number | string[] | undefined;
}

export interface UserLayerCardProps {
  id: string;
  name: string;
  description: string;
  typeOfCard: string;
  legend: string;
  points_color?: string;
  onMoreInfo(selectedCatalog: {
    id: string;
    name: string;
    typeOfCard: string;
  }): void;
}
export interface CardItem {
  id: string;
  name: string;
  typeOfCard: string;
  points_color?: string;
  legend?: string;
  lyrs?: { layer_id: string; points_color: string }[];
  city_name?: string;
}

// Catalog Context Type
export interface CatalogContextType {
  formStage: "catalog" | "catalogDetails" | "save";
  saveMethod: string;
  isLoading: boolean;
  isError: Error | null;
  legendList: string[];
  subscriptionPrice: string;
  description: string;
  name: string;
  selectedContainerType: "Catalogue" | "Layer" | "Home";
  setFormStage: React.Dispatch<React.SetStateAction<"catalog" | "catalogDetails" | "save">>;
  setSaveMethod: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsError: React.Dispatch<React.SetStateAction<Error | null>>;
  setLegendList: React.Dispatch<React.SetStateAction<string[]>>;
  setSubscriptionPrice: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setSelectedContainerType: React.Dispatch<React.SetStateAction<"Catalogue" | "Layer" | "Home">>;
  handleAddClick: (id: string, name: string, typeOfCard: string, legend?: string, layers?: { layer_id: string; points_color: string }[]) => void;
  handleSaveCatalog: () => Promise<void>;
  resetFormStage: (resetTo: "catalog") => void;
  geoPoints: MapFeatures[];
  setGeoPoints: React.Dispatch<React.SetStateAction<MapFeatures[]>>;
  selectedColor: { name: string; hex: string } | null;
  setSelectedColor: React.Dispatch<React.SetStateAction<{ name: string; hex: string } | null>>;
  resetState: () => void;
  saveResponse: SaveResponse | null;
  saveResponseMsg: string;
  saveReqId: string;
  setSaveResponse: React.Dispatch<React.SetStateAction<SaveResponse | null>>;
  colors: string[][];
  setColors: React.Dispatch<React.SetStateAction<string[][]>>;
  chosenPallet: any;
  setChosenPallet: React.Dispatch<React.SetStateAction<any>>;
  radiusInput: number | null;
  setRadiusInput: React.Dispatch<React.SetStateAction<number | null>>;
  gradientColorBasedOnZone: GradientColorBasedOnZone[];
  setGradientColorBasedOnZone: React.Dispatch<React.SetStateAction<GradientColorBasedOnZone[]>>;
  handleColorBasedZone: () => Promise<void>;
  visualizationMode: VisualizationMode;
  setVisualizationMode: React.Dispatch<React.SetStateAction<VisualizationMode>>;
  updateLayerColor: (layerId: number, newColor: string) => void;
  updateLayerDisplay: (layerIndex: number, display: boolean) => void;
  updateLayerHeatmap: (layerIndex: number, isHeatmap: boolean) => void;
  removeLayer: (layerIndex: number) => void;
  isAdvanced: boolean;
  setIsAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  isAdvancedMode: Record<string, any>;
  setIsAdvancedMode: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  openDropdownIndices: (number | null)[];
  setOpenDropdownIndices: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  updateDropdownIndex: (index: number, value: number | null) => void;
  selectedBasedon: string;
  setSelectedBasedon: React.Dispatch<React.SetStateAction<string>>;
  layerColors: Record<string, any>;
  setLayerColors: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isRadiusMode: boolean;
  setIsRadiusMode: React.Dispatch<React.SetStateAction<boolean>>;
  updateLayerGrid: (layerIndex: number, isGrid: boolean) => void;
  deletedLayers: Array<{ layer: MapFeatures; index: number; timestamp: number }>;
  restoreLayer: (timestamp: number) => void;
  basedOnLayerId: string | null;
  setBasedOnLayerId: (id: string) => void;
}

export interface GradientColorBasedOnZone extends MapFeatures {
  sub_lyr_id: string;
  [key: string]: any;
}

export interface ReqGradientColorBasedOnZone {
  color_grid_choice: string[];
  change_lyr_id: string;
  change_lyr_name: string;
  based_on_lyr_id: string;
  based_on_lyr_name: string;
  offset_value: number;
  color_based_on: string;
}

interface Color {
  name: string;
  hex: string;
}

export interface SaveResponse {
  message: string;
  request_id: string;
  data: string;
}

export interface City {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  type: string | null;
}

export interface RequestType {
  id: string;
  requestMessage: string;
  error: Error | null;
}

export interface LayerState {
  selectedColor: Color | null;
  saveResponse: SaveResponse | null;
  isLoading: boolean;
  datasetInfo: {
    bknd_dataset_id: string;
    prdcer_lyr_id: string;
  } | null;
  customName?: string;
}

export interface LayerContextType {
  reqSaveLayer: {
    legend: string;
    description: string;
    name: string;
  };
  setReqSaveLayer: React.Dispatch<
    React.SetStateAction<{
      legend: string;
      description: string;
      name: string;
    }>
  >;
  createLayerformStage: string;
  isError: Error | null;
  manyFetchDatasetResp: FetchDatasetResponse | undefined;
  saveMethod: string;
  loading: boolean;
  saveResponse: SaveResponse | null;
  setFormStage: React.Dispatch<React.SetStateAction<string>>;
  setIsError: React.Dispatch<React.SetStateAction<Error | null>>;
  setManyFetchDatasetResp: React.Dispatch<
    React.SetStateAction<FetchDatasetResponse | undefined>
  >;
  setSaveMethod: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  incrementFormStage(): void;
  handleSaveLayer(): void;
  resetFormStage(): void;
  selectedColor: Color | null;
  setSelectedColor: React.Dispatch<React.SetStateAction<Color | null>>;
  saveOption: string;
  setSaveOption: React.Dispatch<React.SetStateAction<string>>;
  datasetInfo: { bknd_dataset_id: string; prdcer_lyr_id: string } | null;
  setDatasetInfo: React.Dispatch<
    React.SetStateAction<{
      bknd_dataset_id: string;
      prdcer_lyr_id: string;
    } | null>
  >;
  saveResponseMsg: string;
  setSaveResponseMsg: React.Dispatch<React.SetStateAction<string>>;
  setSaveResponse: React.Dispatch<React.SetStateAction<SaveResponse | null>>;
  setSaveReqId: React.Dispatch<React.SetStateAction<string>>;
  centralizeOnce: boolean;
  setCentralizeOnce: React.Dispatch<React.SetStateAction<boolean>>;
  initialFlyToDone: boolean;
  setInitialFlyToDone: React.Dispatch<React.SetStateAction<boolean>>;
  showLoaderTopup: boolean;
  setShowLoaderTopup: React.Dispatch<React.SetStateAction<boolean>>;
  handleFetchDataset(action: string, pageToken?: string): void;
  reqFetchDataset: ReqFetchDataset;
  setReqFetchDataset: React.Dispatch<React.SetStateAction<ReqFetchDataset>>;
  textSearchInput: string;
  setTextSearchInput: React.Dispatch<React.SetStateAction<string>>;
  searchType: string;
  setSearchType: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  countries: string[];
  setCountries: React.Dispatch<React.SetStateAction<string[]>>;
  cities: City[];
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
  citiesData: { [country: string]: City[] };
  setCitiesData: React.Dispatch<
    React.SetStateAction<{ [country: string]: City[] }>
  >;
  categories: CategoryData;
  setCategories: React.Dispatch<React.SetStateAction<CategoryData>>;
  handleCountryCitySelection: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  handleTypeToggle: (type: string) => void;
  validateFetchDatasetForm: () => true | Error;
  resetFetchDatasetForm(): void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;

  currentLayerGroup: LayerGroup | null;
  setCurrentLayerGroup: React.Dispatch<React.SetStateAction<LayerGroup | null>>;

  addLayerToGroup(groupId: string, layer: Layer): void;
  removeLayerFromGroup(groupId: string, layerId: number): void;
  updateLayerInGroup(groupId: string, layerId: number, updates: Partial<Layer>): void;

  selectedCountry: string;
  setSelectedCountry: React.Dispatch<React.SetStateAction<string>>;

  layerStates: { [layerId: number]: LayerState };
  updateLayerState: (layerId: number, updates: Partial<LayerState>) => void;
}

export interface ReqFetchDataset {
  selectedCountry: string;
  selectedCity: string;
  layers: {
    name: string;
    points_color: string;
    id: number;
    includedTypes: string[];
    excludedTypes: string[];
    layer_name?: string;
  }[];
  includedTypes: string[];
  excludedTypes: string[];
}

export interface ModalOptions {
  darkBackground?: boolean;
  isSmaller?: boolean;
}

export interface UIContextProps {
  isModalOpen: boolean;
  modalContent: ReactNode;
  modalOptions: ModalOptions;
  sidebarMode: string;
  isMenuExpanded: boolean;
  isViewClicked: boolean;
  openModal(content: ReactNode, options?: ModalOptions): void;
  closeModal(): void;
  toggleMenu(): void;
  handleViewClick(): void;
  setSidebarMode(mode: string): void;
  resetViewState(): void;
  isMobile: boolean;
  setIsMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface GeoPoint {
  location: { lat: number; lng: number };
}

export type ArrayGeoPoint = Array<GeoPoint>;

export interface BoxmapProperties {
  name: string;
  rating: number | string;
  address: string;
  phone: string;
  website: string;
  business_status: string;
  user_ratings_total: number | string;
  priceLevel?: number;
  heatmap_weight?: number;
  [key: string]: any;
}

export interface Feature {
  type: "Feature";
  properties: BoxmapProperties;
  display: boolean;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}
export interface FetchDatasetResponse {
  type: "FeatureCollection";
  features: Feature[];
  bknd_dataset_id: string;
  prdcer_lyr_id: string;
  records_count: number;
  next_page_token: string;
  display?: boolean;
}

export type Bounds = [number, number, number, number]; // [west, south, east, north]

export interface MapFeatures extends FetchDatasetResponse {
  prdcer_layer_name?: string;
  points_color?: string;
  layer_legend?: string;
  layer_description?: string;
  is_zone_lyr?: string;
  city_name?: string;
  is_heatmap?: boolean;
  is_grid?: boolean;
  bounds?: Bounds;
  basedon: string;
  layerGroupId?: string;
  layerId?: number;
  gradient_groups?: GradientGroup[];
  is_gradient?: boolean;
  gradient_based_on?: string;
  [key: string]: any;
}

export interface TabularData {
  formatted_address: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  website: string;
}
export interface AuthSuccessResponse {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered: boolean;
  refreshToken: string;
  expiresIn: string;
  created_at: number; // We'll add this when saving to localStorage
}

export interface AuthFailedResponse {
  error: {
    code: number;
    message: string;
    errors: {
      message: string;
      domain: string;
      reason: string;
    }[];
  };
}
export interface UserProfile {
  name: string;
  email: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
}

export type AuthResponse =
  | AuthSuccessResponse
  | AuthFailedResponse
  | object
  | null;

export interface AuthContextType {
  authResponse: AuthResponse;
  setAuthResponse: (response: AuthResponse) => void;
  isAuthenticated: boolean;
  logout: () => void;
  authLoading: boolean;
}
export interface CategoryData {
  [category: string]: string[];
}

export interface CostEstimate {
  cost: number;
  api_calls: number;
}

export interface CityBorders {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

export interface CityData {
  name: string;
  borders: CityBorders;
}

export interface Layer {
  id: number;
  name: string;
  layer_name?: string;
  includedTypes: string[];
  excludedTypes: string[];
  display?: boolean;
  points_color?: string;
  is_heatmap?: boolean;
  is_grid?: boolean;
  basedon?: string;
  layer_legend?: string;
  layer_description?: string;
  prdcer_lyr_id?: string;
}

export interface LayerGroup {
  id: string;
  name: string;
  layers: Layer[];
  created_at?: string;
  updated_at?: string;
}

export interface LayerSettings {
  display: boolean;
  points_color: string;
  is_heatmap: boolean;
  is_grid: boolean;
  basedon?: string;
}

export interface LayerDataMap {
  [layerId: number]: FetchDatasetResponse;
}

export interface LayerCustomization {
  name: string;
  legend: string;
  description: string;
  color: string;
  layerId: number;
}

// Update ReqSaveLayer interface
export interface ReqSaveLayer {
  layers: LayerCustomization[];
}

export type VisualizationMode = 'vertex' | 'heatmap' | 'grid';

export interface GradientGroup {
  color: string;
  legend: string;
  count: number;
}


export const DisplayType = {
  REGULAR: 'regular',
  HEATMAP: 'heatmap',
  GRID: 'grid'
} as const;