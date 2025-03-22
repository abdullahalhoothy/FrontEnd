import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import urls from './../../urls.json';
import apiRequest from '../../services/apiRequest';

const ChangeEmail: React.FC = () => {
  const { isAuthenticated, authResponse } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    if (data.new_email === '' || data.confirm_email === '' || data.password === '') {
      setError({
        message: 'All fields are required',
        name: 'All fields are required',
      });
      return;
    }

    if (data.new_email !== data.confirm_email) {
      setError({
        message: 'Emails do not match',
        name: 'Emails do not match',
      });
      return;
    }
    data.user_id = authResponse?.localId;
    data.current_email = authResponse?.email;

    setLoading(true);
    try {
      const res = await apiRequest({
        url: urls.change_email,
        method: 'post',
        body: data,
        isAuthRequest: true,
      });
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="mx-2 max-w-96 space-y-1 mb-4">
        <h2 className="text-2xl font-semibold text-gray-700 ">Change Email</h2>
      </div>
      <form
        className="p-4 sm:rounded-lg border bg-white shadow mx-2 w-full sm:max-w-96"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            New Email
          </label>
          <input
            type="email"
            id="email"
            name="new_email"
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="confirm-email">
            Confirm New Email
          </label>
          <input
            type="email"
            id="confirm-email"
            name="confirm_email"
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* password */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error?.response?.data?.detail || error?.message}
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-primary"
        >
          Change Email
        </button>
      </form>
    </div>
  );
};

export default ChangeEmail;
