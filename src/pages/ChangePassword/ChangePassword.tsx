import React, { useState, FormEvent } from "react";
import { HttpReq } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import urls from "./../../urls.json";
import apiRequest from "../../services/apiRequest";

const ChangePassword: React.FC = () => {
  const { isAuthenticated, authResponse } = useAuth();

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    if (
      data.password === "" ||
      data.new_password === "" ||
      data.confirm_password === ""
    ) {
      setError({
        message: "All fields are required",
        name: "All fields are required",
      });
      return;
    }
    if (data.new_password !== data.confirm_password) {
      setError({
        message: "Passwords do not match",
        name: "Passwords do not match",
      });
      return;
    }
    data.user_id = authResponse?.localId;
    data.email = authResponse?.email;

    // await HttpReq(
    //   urls.change_password,
    //   () => {},
    //   () => {},
    //   () => {},
    //   setLoading,
    //   setError,
    //   "post",
    //   data,
    //   authResponse?.idToken
    // );

    setLoading(true);
    try {
      const res = await apiRequest({
        url: urls.change_password,
        method: "post",
        body: data,
        isAuthRequest: true,
      });
      if (res.status === 200) {
        navigate("/auth");
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="mx-2 max-w-96 space-y-1 mb-4">
        <h2 className="text-2xl font-semibold text-gray-700 ">
          Change Password
        </h2>
      </div>
      <form
        className="p-4 sm:rounded-lg border bg-white shadow mx-2 w-full sm:max-w-96"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 mb-2"
            htmlFor="current-password"
          >
            Current Password
          </label>
          <input
            type="password"
            id="current-password"
            name="password"
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="new-password">
            New Password
          </label>
          <input
            type="password"
            id="new-password"
            name="new_password"
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 mb-2"
            htmlFor="confirm-password"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirm-password"
            name="confirm_password"
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
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Changing Password..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
