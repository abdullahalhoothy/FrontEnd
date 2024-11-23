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
}

// Catalog Context Type
export interface CatalogContextType {
  formStage: string;
  saveMethod: string;
  isLoading: boolean;
  isError: Error | null;
  legendList: string[];
  subscriptionPrice: string;
  description: string;
  name: string;
  selectedContainerType: "Catalogue" | "Layer" | "Home";
  setFormStage: React.Dispatch<
    React.SetStateAction<"catalog" | "catalogDetails" | "save">
  >;
  setSaveMethod: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsError: React.Dispatch<React.SetStateAction<Error | null>>;
  setLegendList: React.Dispatch<React.SetStateAction<string[]>>;
  setSubscriptionPrice: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setSelectedContainerType: React.Dispatch<
    React.SetStateAction<"Catalogue" | "Layer" | "Home">
  >;
  handleAddClick(
    id: string,
    name: string,
    typeOfCard: string,
    legend?: string,
    layers?: { layer_id: string; points_color: string }[]
  ): void;
  handleSaveLayer(): void;
  resetFormStage(resetTo: string): void;
  geoPoints: MapFeatures[];
  setGeoPoints: React.Dispatch<React.SetStateAction<MapFeatures[]>>;
  selectedColor: Color | null;
  setSelectedColor: React.Dispatch<React.SetStateAction<Color | null>>;
  resetState(): void;
  updateLayerColor(layerIndex: number | null, newColor: string): void;
  updateLayerDisplay(layerIndex: number, display: boolean): void;
  // updateLayerZone(layerIndex: number, isZoneLayer: boolean): void;
  updateLayerHeatmap(layerIndex: number, isHeatmap: boolean): void;
  removeLayer(layerIndex: number): void;
  saveResponse: SaveResponse | null;
  saveResponseMsg: string;
  saveReqId: string;
  setSaveResponse: React.Dispatch<React.SetStateAction<SaveResponse | null>>;
  openDropdownIndices: (number | null)[];
  setOpenDropdownIndices: React.Dispatch<
    React.SetStateAction<(number | null)[]>
  >;

  isAdvanced: boolean;
  setIsAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  radiusInput: number | null;
  setRadiusInput: React.Dispatch<React.SetStateAction<number | null>>;
  setColors: React.Dispatch<React.SetStateAction<string[]>>;
  colors: string[];
  reqGradientColorBasedOnZone: ReqGradientColorBasedOnZone;
  setReqGradientColorBasedOnZone: React.Dispatch<
    React.SetStateAction<ReqGradientColorBasedOnZone>
  >;
  gradientColorBasedOnZone: GradientColorBasedOnZone[];
  setGradientColorBasedOnZone: React.Dispatch<
    React.Dispatch<React.SetStateAction<GradientColorBasedOnZone[]>>
  >;
  chosenPallet: number | null;
  setChosenPallet: React.Dispatch<React.SetStateAction<number | null>>;
  selectedBasedon: string;
  setSelectedBasedon: React.Dispatch<React.SetStateAction<string>>;

  layersColor: {};
  setLayersColor: React.Dispatch<React.SetStateAction<{}>>;
  isAdvancedMode: {};
  setIsAdvancedMode: React.Dispatch<React.SetStateAction<{}>>;
}

export interface GradientColorBasedOnZone extends MapFeatures {
  sub_lyr_id: string;
  [key: string]: any;
}

export interface ReqGradientColorBasedOnZone {
  prdcer_lyr_id: string;
  user_id: string;
  color_grid_choice: string[];
  change_lyr_id: string;
  based_on_lyr_id: string;
  radius_offset: number;
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
}

export interface ReqFetchDataset {
  selectedCountry: string;
  selectedCity: string;
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

export interface MapFeatures extends FetchDatasetResponse {
  prdcer_layer_name?: string;
  points_color?: string;
  layer_legend?: string;
  layer_description?: string;
  is_zone_lyr?: string;
  is_heatmap?: boolean;
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
