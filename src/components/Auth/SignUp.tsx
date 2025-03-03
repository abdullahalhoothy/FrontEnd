import React, { useState } from 'react';

interface SignUpProps {
  onSubmit?: (formData: FormData) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  country: string;
  useCase?: string[];
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
    useCase: [],
  });

  const [currentPage, setCurrentPage] = useState<number>(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setCurrentPage(1);
  };

  const handlePrevious = () => {
    setCurrentPage(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <main className="w-full font-rajdhani text-gray-50 min-h-screen overflow-y-scroll bg-no-repeat bg-scroll bg-origin-padding bg-clip-border bg-[radial-gradient(circle,rgb(44,24,74)_0%,rgb(18,4,25)_33%)]">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Marketing Content */}
          <div className=" rounded-lg shadow-lg p-8 lg:w-2/3">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                        required
                      />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                        required
                      />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                      required
                    />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                        required
                      />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                        required
                      />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                      required
                    >
                      <option value="">Select country</option>
                      <option value="United States of America (USA)">
                        United States of America (USA)
                      </option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      {/* Add more countries as needed */}
                    </select>
                  </div>

                  <div>
                    <p className="text-sm text-gray-100 mb-2">
                      What do you want to build and run with S-Locator? (Optional)
                    </p>
                    <select
                      id="useCase"
                      name="useCase"
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
                    <div className="space-y-4">
                      <label className="flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="userType" value="admin" className="mt-1 mr-3" />
                        <div>
                          <span className="block font-medium text-gray-100">
                            Want to Set Up an Account for the Team as an Admin
                          </span>
                          <div className="mt-2 h-24 bg-gray-200 rounded"></div>
                        </div>
                      </label>

                      <label className="flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="userType" value="team" className="mt-1 mr-3" />
                        <div>
                          <span className="block font-medium text-gray-100">
                            Want to Join a Team
                          </span>
                          <div className="mt-2 h-24 bg-gray-200 rounded"></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="hidden">
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
                        placeholder="E.g. team-01 or john@doe.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-100 mb-4">
                    By clicking "Continue," you agree to S-Locator Terms of Service.
                  </p>
                </>
              )}

              <div className="flex justify-between mt-6">
                {currentPage === 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-100 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Previous
                  </button>
                )}

                <button
                  type={currentPage === 1 ? 'submit' : 'button'}
                  onClick={currentPage === 0 ? handleNext : undefined}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto"
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
