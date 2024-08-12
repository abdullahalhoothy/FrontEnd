// hooks/useLocationAndCategories.ts

import { useEffect } from 'react';
import { HttpReq } from '../services/apiService';
import urls from '../urls.json';
import { useLayerContext } from '../context/LayerContext';
import { processCityData } from '../utils/helperFunctions';
import { City, CategoryData, FormData } from '../types/allTypesAndInterfaces';

export function useLocationAndCategories() {
    const {
      countries,
      setCountries,
      cities,
      setCities,
      citiesData,
      setCitiesData,
      categories,
      setCategories,
      firstFormData,
      setFirstFormData,
      setIsError
    } = useLayerContext();
  
    useEffect(() => {
      fetchData();
    }, []);
  
    function fetchData() {
      HttpReq<string[]>(
        urls.country_city,
        (data) => setCountries(processCityData(data, setCitiesData)),
        () => {},
        () => {},
        () => {},
        setIsError
      );
  
      HttpReq<CategoryData>(
        urls.nearby_categories,
        setCategories,
        () => {},
        () => {},
        () => {},
        setIsError
      );
    }
  
    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
      const { name, value } = event.target;
      setFirstFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      if (name === 'selectedCountry') {
        const selectedCountryCities = citiesData[value] || [];
        setCities(selectedCountryCities);
        setFirstFormData((prevData) => ({
          ...prevData,
          selectedCity: '',
        }));
      }
    }
  
    function handleTypeToggle(type: string) {
      setFirstFormData((prevData) => {
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
  
    function validateForm(action: string) {
      if (!firstFormData.selectedCountry || !firstFormData.selectedCity) {
        setIsError(new Error('Country and city are required.'));
        return false;
      }
      if (firstFormData.includedTypes.length === 0 && firstFormData.excludedTypes.length === 0) {
        setIsError(new Error('At least one category must be included or excluded.'));
        return false;
      }
      if (firstFormData.includedTypes.length > 50 || firstFormData.excludedTypes.length > 50) {
        setIsError(new Error('Up to 50 types can be specified in each type restriction category.'));
        return false;
      }
      setIsError(null);
      return true;
    }
  
    return {
      countries,
      cities,
      categories,
      firstFormData,
      handleChange,
      handleTypeToggle,
      validateForm,
      setFirstFormData,
    };
  }