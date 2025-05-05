import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import countriesData from '../countries-data.json';
import { Country, FormData, FormErrors } from '../types/auth';
import { useAuth } from './AuthContext';
import apiRequest from '../services/apiRequest';
import urls from '../urls.json';

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
  isSubmitting: boolean;
  submitError: string | null;
}

const SignUpContext = createContext<SignUpContextType | undefined>(undefined);

export const SignUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setAuthResponse } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    title: '',
    phone: '',
    country: '',
    reason: '',
    userType: '',
    teamId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (countriesData && countriesData.countries) {
      setCountries(countriesData.countries);
    }
  }, []);

  // First page validation schema
  const firstPageSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
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
    setSubmitError(null);

    const isValid = await validateSecondPage();
    if (isValid) {
      setIsSubmitting(true);

      try {
        const selectedCountry = countries.find(c => c.name === formData.country);

        const registrationData = {
          email: formData.email,
          password: formData.password,
          username: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
          title: formData.title,
          phone: formData.phone,
          country: selectedCountry?.isoAlpha3 || '',
          reason: formData.reason || '',
          account_type: formData.userType === 'admin' ? 'admin' : 'user',
          teamId: formData.teamId,
          show_price_on_purchase: false,
          user_id: '',
        };

        const response = await apiRequest({
          url: urls.create_user_profile,
          method: 'POST',
          body: registrationData,
        });

        if (response && response.data) {
          const data = response.data;

          if (Array.isArray(data) && data.length > 0) {
            const userProfileResponse = data[0];

            if (userProfileResponse?.data?.user_id) {
              setAuthResponse({
                localId: userProfileResponse.data.user_id,
                email: formData.email,
                displayName: formData.firstName,
                idToken: userProfileResponse.data.token || '',
                refreshToken: userProfileResponse.data.refresh_token || '',
                expiresIn: '3600',
                user: {
                  id: userProfileResponse.data.user_id,
                  email: formData.email,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                },
              });

              setIsSubmitting(false);

              toast.success('Registration successful! Please verify your e-mail.', {
                duration: 3000,
              });

              navigate('/');
            } else {
              throw new Error('Invalid registration response');
            }
          } else if (data?.detail) {
            throw new Error(data.detail);
          } else {
            throw new Error('Registration failed - invalid response format');
          }
        } else {
          throw new Error('Registration failed - no response data');
        }
      } catch (error) {
        console.error('Registration error:', error);
        setSubmitError(error.message || 'Registration failed. Please try again.');
        setIsSubmitting(false);

        toast.error(error.message || 'Registration failed. Please try again.', {
          duration: 3000,
        });
      }
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
    isSubmitting,
    submitError,
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
