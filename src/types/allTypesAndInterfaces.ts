import React, { ReactNode } from "react";
import { Interface } from "readline";

export interface ModalProps {
  children: React.ReactNode;
  darkBackground?: boolean;
  isSmaller?: boolean;
}

export interface FormData {
  selectedCountry: string;
  selectedCity: string;
  selectedCategory: string;
  selectedSubcategory: string;
}

export interface ExpandableMenuProps {
  children: ReactNode;
}

export interface MultipleLayersSettingProps {
  layerIndex: number;
}

export interface SaveProducerLayerResponse {
  message: string;
  request_id: string;
  data: string;
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
  address: string;
  phone: string;
  website: string;
  business_status: string;
  user_ratings_total: number;
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
  setFormStage: React.Dispatch<React.SetStateAction<string>>;
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
    existingColor?: string,
    legend?: string,
    layers?: { layer_id: string; points_color: string }[]
  ): void;
  handleSave(): void;
  resetFormStage(resetTo: string): void;
  geoPoints: MapFeatures | string;
  setGeoPoints: React.Dispatch<React.SetStateAction<MapFeatures | string>>;
  selectedColor: string;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  selectedLayers: {
    name: string;
    id: string;
    color: string;
    is_zone_lyr: boolean;
    display: boolean;
    legend?: string;
  }[];
  setSelectedLayers: React.Dispatch<
    React.SetStateAction<
      {
        name: string;
        id: string;
        color: string;
        is_zone_lyr: boolean;
        display: boolean;
        legend?: string;
      }[]
    >
  >;
  resetState(): void;
  updateLayerColor(layerIndex: number, newColor: string): void;
  updateLayerZone(layerIndex: number, isZoneLayer: boolean): void;
  setTempGeoPointsList: React.Dispatch<React.SetStateAction<MapFeatures[]>>;
  openDropdownIndex: number | null;
  setOpenDropdownIndex: React.Dispatch<React.SetStateAction<number | null>>;
  updateLayerDisplay(layerIndex: number, display: boolean): void;
  saveResponse: SaveResponse | null;
  saveResponseMsg: string;
  saveReqId: string;
  setSaveResponse: React.Dispatch<React.SetStateAction<SaveResponse | null>>;
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
  secondFormData: {
    pointColor: string;
    legend: string;
    description: string;
    name: string;
  };
  setSecondFormData: React.Dispatch<
    React.SetStateAction<{
      pointColor: string;
      legend: string;
      description: string;
      name: string;
    }>
  >;
  formStage: string;
  isError: Error | null;
  firstFormResponse: string | FirstFormResponse;
  saveMethod: string;
  loading: boolean;
  saveResponse: SaveProducerLayerResponse | null;
  setFormStage: React.Dispatch<React.SetStateAction<string>>;
  setIsError: React.Dispatch<React.SetStateAction<Error | null>>;
  setFirstFormResponse: React.Dispatch<
    React.SetStateAction<string | FirstFormResponse>
  >;
  setSaveMethod: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleNextStep(): void;
  handleSave(): void;
  resetFormStage(): void;
  colorOptions: string[];
  selectedColor: string;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
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
  setSaveResponse: React.Dispatch<
    React.SetStateAction<SaveProducerLayerResponse | null>
  >;
  setSaveReqId: React.Dispatch<React.SetStateAction<string>>;
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
  geoPointId: string;
  color: string;
}

export interface Feature {
  type: "Feature";
  properties: BoxmapProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface MapFeatures {
  type: "FeatureCollection";
  features: Feature[];
}


export interface FirstFormResponse {
  type: MapFeatures;
  features: Feature[];
  bknd_dataset_id: string;
  prdcer_lyr_id: string;
  records_count: number;
  next_page_token: string;
}

// Commented out to avoid duplication
// export interface BusinessResponse {
//     geometry: {
//       location: {
//         lng: number;
//         lat: number;
//       };
//     };
//   }

export interface TabularData {
  formatted_address: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  website: string;
}
