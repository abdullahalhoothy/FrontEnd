import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Yup from 'yup';
import countriesData from '../fakeData/countries-data.json';
import { Country, FormData, FormErrors } from '../types/auth';
import { useAuth } from './AuthContext';

interface SignUpContextType {
  formData: FormData;
  errors: FormErrors;
  countries: Country[];
  currentPage: number;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleUserTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const SignUpContext = createContext<SignUpContextType | undefined>(undefined);

export const SignUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setAuthResponse } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    country: '',
    reason: [],
    userType: '',
    teamId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    // Load countries from the imported JSON file
    if (countriesData && countriesData.countries) {
      setCountries(countriesData.countries);
    }
  }, []);

  // First page validation schema
  const firstPageSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    company: Yup.string().required('Company is required'),
    title: Yup.string().required('Title is required'),
    country: Yup.string().required('Country is required'),
    phone: Yup.string().optional(),
  });

  // Second page validation schema
  const secondPageSchema = Yup.object().shape({
    userType: Yup.string().required('Please select how you will use S-Locator'),
    teamId: Yup.string().when('userType', {
      is: 'team',
      then: schema => schema.required('Team ID or manager email is required'),
      otherwise: schema => schema.optional(),
    }),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateFirstPage = async (): Promise<boolean> => {
    try {
      await firstPageSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const validationErrors: FormErrors = {};
        err.inner.forEach(error => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
        setErrors(validationErrors);
      }
      return false;
    }
  };

  const validateSecondPage = async (): Promise<boolean> => {
    try {
      await secondPageSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const validationErrors: FormErrors = {};
        err.inner.forEach(error => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
        setErrors(validationErrors);
      }
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateFirstPage();
    if (isValid) {
      setCurrentPage(1);
    }
  };

  const handlePrevious = () => {
    setCurrentPage(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateSecondPage();
    if (isValid) {
      // Make an API call to register the user
      const mockAuthResponse = {};

      // Update auth context with the new user
      //setAuthResponse(mockAuthResponse);
    }
  };

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, userType: value }));
  };

  const value = {
    formData,
    errors,
    countries,
    currentPage,
    handleInputChange,
    handleUserTypeChange,
    handleNext,
    handlePrevious,
    handleSubmit,
  };

  return <SignUpContext.Provider value={value}>{children}</SignUpContext.Provider>;
};

export const useSignUp = () => {
  const context = useContext(SignUpContext);
  if (context === undefined) {
    throw new Error('useSignUp must be used within a SignUpProvider');
  }
  return context;
};
