import React from 'react';
import { useSignUp } from '../../../context/SignUpContext';

const FirstPage: React.FC = () => {
  const { formData, errors, countries, handleInputChange } = useSignUp();

  return (
    <>
      <div>
        <p className="font-bold text-gray-100">Create your S-Locater account</p>
        <p className="text-gray-200 italic">
          Sign up with your work email to elevate your trial with expert assistance and more.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-100 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="E.g. John"
            className={`w-full px-3 py-2 border ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
            required
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-100 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="E.g. Doe"
            className={`w-full px-3 py-2 border ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
            required
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
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
          className={`w-full px-3 py-2 border ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-100 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Enter your password"
          className={`w-full px-3 py-2 border ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
          required
        />
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        <p className="mt-1 text-xs text-gray-400">
          Password must be at least 8 characters and contain uppercase, lowercase, and numbers
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-100 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="s-locator"
            className={`w-full px-3 py-2 border ${
              errors.company ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
            required
          />
          {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-100 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="E.g. CTO"
            className={`w-full px-3 py-2 border ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
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
        <label htmlFor="country" className="block text-sm font-medium text-gray-100 mb-1">
          Country <span className="text-red-500">*</span>
        </label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border ${
            errors.country ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
          required
        >
          <option value="">Select country</option>
          {countries.map(country => (
            <option key={country.isoAlpha3} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
        {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
      </div>

      <div>
        <p className="text-sm text-gray-100 mb-2">
          What do you want to build and run with S-Locator? (Optional)
        </p>
        <select
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
        >
          <option value="">Please choose an option</option>
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
        By clicking "Continue," you agree to S-Locator processing your personal data in accordance
        with its Privacy Notice.
      </p>
    </>
  );
};

export default FirstPage;
