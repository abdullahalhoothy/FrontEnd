import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { FormErrors, SignUpProps, FormData } from '../../types';
import countriesData from '../../fakeData/countries-data.json';

interface Country {
  isoAlpha3: string;
  name: string;
}

const SignUp: React.FC<SignUpProps> = ({ onSubmit }) => {
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
    if (isValid && onSubmit) {
      onSubmit(formData);
    }
  };

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, userType: value }));

    // Show/hide team ID field based on selection
    const teamIdField = document.getElementById('teamIdField');
    if (teamIdField) {
      if (value === 'team') {
        teamIdField.classList.remove('hidden');
      } else {
        teamIdField.classList.add('hidden');
      }
    }
  };

  return (
    <main className="w-full font-rajdhani text-gray-50 min-h-screen overflow-y-scroll bg-no-repeat bg-scroll bg-origin-padding bg-clip-border bg-[radial-gradient(circle,rgb(44,24,74)_0%,rgb(18,4,25)_33%)]">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Marketing Content */}
          <div className="rounded-lg shadow-lg p-8 lg:w-2/3">
            <h2 className="text-3xl font-bold text-gray-200 mb-4">
              Power Your Distribution with Smarter Location Intelligence
            </h2>

            <p className="text-gray-100 mb-6">
              Stay ahead in the competitive world of product distribution with S-Locator, your
              all-in-one platform for optimizing routes, reducing costs, and increasing efficiency.
              Whether you're managing fleet logistics, supply chains, or retail distribution, our
              geospatial intelligence solutions help you make data-driven decisions that drive
              growth.
            </p>

            <div className="mb-6">
              <div className="flex items-center text-white text-xl font-semibold mb-2">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Optimize Delivery Routes &amp; Reduce Costs</span>
              </div>

              <p className="text-gray-100 mb-2">
                Leverage real-time geospatial data to streamline your fleet operations. S-Locator's
                smart routing ensures:
              </p>
              <ul className="list-disc pl-5 text-gray-100 space-y-2 mb-4">
                <li>Faster deliveries with optimized routes</li>
                <li>Lower fuel and operational costs</li>
                <li>Improved on-time performance</li>
              </ul>
            </div>

            <div className="mb-6">
              <div className="flex items-center text-white text-xl font-semibold mb-2">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Enhance Supply Chain Visibility</span>
              </div>

              <p className="text-gray-100 mb-4">
                Gain full visibility into your distribution network. Track shipments, monitor
                inventory levels, and predict demand with location-based insights, ensuring your
                products reach the right place at the right time.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center text-white text-xl font-semibold mb-2">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Maximize Retail &amp; Distribution Impact</span>
              </div>

              <p className="text-gray-100 mb-2">
                Expand your reach by identifying high-potential markets. S-Locator helps businesses:
              </p>
              <ul className="list-disc pl-5 text-gray-100 space-y-2 mb-4">
                <li>Pinpoint the best warehouse and retail locations</li>
                <li>Analyze customer demand by region</li>
                <li>Optimize last-mile delivery strategies</li>
              </ul>
            </div>

            <p className="font-bold text-3xl text-white mb-6">
              Sign Up Now For Free &amp; Unlock the Power of Location Intelligence!
            </p>

            <div className="flex justify-center md:justify-start gap-4 md:h-8 w-auto">
              <img
                fetchPriority="high"
                src={'src/assets/images/touch.png'}
                alt="Touch"
                className="aspect-[auto_482_/_264] rounded-lg md:rounded-md h-auto w-full md:w-auto"
              />
              <img
                fetchPriority="high"
                src={'src/assets/images/city-baby.png'}
                alt="City Baby"
                className="aspect-[auto_482_/_264] rounded-lg md:rounded-md h-auto w-full md:w-auto"
              />
            </div>
          </div>

          {/* Right Column - Sign Up Form */}
          <div className="rounded-lg shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)] p-8 lg:w-1/3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentPage === 0 ? (
                <>
                  <div>
                    <p className="font-bold text-gray-100">Create your S-Locater account</p>
                    <p className="text-gray-200 italic">
                      Sign up with your work email to elevate your trial with expert assistance and
                      more.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-100 mb-1"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="E.g. John"
                        className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                        required
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-100 mb-1"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="E.g. Doe"
                        className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                        required
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="E.g. john@doe.com"
                      className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                      required
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-100 mb-1"
                      >
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="s-locator"
                        className={`w-full px-3 py-2 border ${errors.company ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                        required
                      />
                      {errors.company && (
                        <p className="mt-1 text-sm text-red-500">{errors.company}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-100 mb-1"
                      >
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="E.g. CTO"
                        className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                        required
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-100 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="E.g. +1 300 400 5000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-100 mb-1"
                    >
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                      required
                    >
                      <option value="">Select country</option>
                      {countries.map(country => (
                        <option key={country.isoAlpha3} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-100 mb-2">
                      What do you want to build and run with S-Locator? (Optional)
                    </p>
                    <select
                      id="reason"
                      name="reason"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                    >
                      <option value="">Please choose all options that are correct</option>
                      <option value="None">None</option>
                      <option value="Streamline-Delivery-Routes-Cut Costs">
                        Streamline Delivery Routes &amp; Cut Costs
                      </option>
                      <option value="Gain-Real-Time-Supply-Chain-Visibility">
                        Gain Real-Time Supply Chain Visibility
                      </option>
                      <option value="Boost-Retail-Distribution-Efficiency">
                        Boost Retail &amp; Distribution Efficiency
                      </option>
                      <option value="Ensure-Faster-Reliable-Deliveries">
                        Ensure Faster &amp; Reliable Deliveries
                      </option>
                      <option value="Understand-Regional-Customer-Demand">
                        Understand Regional Customer Demand
                      </option>
                      <option value="Find-the-Best-Warehouse-Store-Locations">
                        Find the Best Warehouse &amp; Store Locations
                      </option>
                      <option value="Forecast-Demand-with-Geospatial-Insights">
                        Forecast Demand with Geospatial Insights
                      </option>
                    </select>
                  </div>

                  <p className="text-xs text-gray-400">
                    By clicking "Continue," you agree to S-Locator processing your personal data in
                    accordance with its Privacy Notice.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-100 mb-2">How will you be using S-Locator?</p>
                    {errors.userType && (
                      <p className="mb-2 text-sm text-red-500">{errors.userType}</p>
                    )}
                    <div className="space-y-4">
                      <label className="flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-black">
                        <input
                          type="radio"
                          name="userType"
                          value="admin"
                          checked={formData.userType === 'admin'}
                          onChange={handleUserTypeChange}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <span className="block font-medium text-gray-100">
                            Want to Set Up an Account for the Team as an Admin
                          </span>
                          <img
                            className="mt-2 h-24 bg-gray-200 rounded"
                            src={'src/assets/images/admin.png'}
                          />
                        </div>
                      </label>

                      <label className="flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-black">
                        <input
                          type="radio"
                          name="userType"
                          value="team"
                          checked={formData.userType === 'team'}
                          onChange={handleUserTypeChange}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <span className="block font-medium text-gray-100">
                            Want to Join a Team
                          </span>
                          <img
                            className="mt-2 h-24 bg-gray-200 rounded"
                            src={'src/assets/images/team.png'}
                          />{' '}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div id="teamIdField" className={formData.userType === 'team' ? '' : 'hidden'}>
                    <div className="mb-4">
                      <label
                        htmlFor="teamId"
                        className="block text-sm font-medium text-gray-100 mb-1"
                      >
                        Team ID or Team Manager Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="teamId"
                        name="teamId"
                        value={formData.teamId}
                        onChange={handleInputChange}
                        placeholder="E.g. team-01 or john@doe.com"
                        className={`w-full px-3 py-2 border ${errors.teamId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
                      />
                      {errors.teamId && (
                        <p className="mt-1 text-sm text-red-500">{errors.teamId}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-100 mb-4">
                    By clicking "Continue," you agree to S-Locator Terms of Service.
                  </p>
                </>
              )}

              <div className="flex sm:flex-col gap-2 justify-between mt-6">
                {currentPage === 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Previous
                  </button>
                )}

                <button
                  type={currentPage === 1 ? 'submit' : 'button'}
                  onClick={currentPage === 0 ? handleNext : undefined}
                  className="w-auto flex-grow px-4 py-2 text-sm font-medium text-white bg-secondary border border-transparent rounded-md hover:bg-focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {currentPage === 1 ? 'Submit' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SignUp;
