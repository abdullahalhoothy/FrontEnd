import React from 'react';
import { useSignUp } from '../../../context/SignUpContext';

const SecondPage: React.FC = () => {
  const { formData, errors, handleInputChange, handleUserTypeChange } = useSignUp();

  return (
    <>
      <div>
        <p className="text-sm text-gray-100 mb-2">How will you be using S-Locator?</p>
        {errors.userType && <p className="mb-2 text-sm text-red-500">{errors.userType}</p>}
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
                alt="Admin illustration"
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
              <span className="block font-medium text-gray-100">Want to Join a Team</span>
              <img
                className="mt-2 h-24 bg-gray-200 rounded"
                src={'src/assets/images/team.png'}
                alt="Team illustration"
              />
            </div>
          </label>
        </div>
      </div>

      <div id="teamIdField" className={formData.userType === 'team' ? '' : 'hidden'}>
        <div className="mb-4">
          <label htmlFor="teamId" className="block text-sm font-medium text-gray-100 mb-1">
            Team ID or Team Manager Email <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="teamId"
            name="teamId"
            value={formData.teamId}
            onChange={handleInputChange}
            placeholder="E.g. team-01 or john@doe.com"
            className={`w-full px-3 py-2 border ${
              errors.teamId ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
          />
          {errors.teamId && <p className="mt-1 text-sm text-red-500">{errors.teamId}</p>}
        </div>
      </div>

      <p className="text-sm text-gray-100 mb-4">
        By clicking "Continue," you agree to S-Locator Terms of Service.
      </p>
    </>
  );
};

export default SecondPage;
