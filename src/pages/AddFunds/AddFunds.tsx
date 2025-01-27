import { loadStripe } from "@stripe/stripe-js";
import React, { useState, FormEvent, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import apiRequest from "../../services/apiRequest";
import urls from "../../urls.json";

const AddFundsForm: React.FC = () => {
  const { authResponse } = useAuth();
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // State for individual card field errors
  const [submitting, setSubmitting] = useState(false);
  const [cost, setCost] = useState<number | null>(null);



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Clear previous errors and set loading state
    setErrorMessage(null);
    setSubmitting(true);

    try {
      //Send topup amount and user_id to the backend

      const response = await apiRequest({
        url: urls.top_up_wallet,
        method: "POST",
        body: {
          amount: cost * 100, //multiply by 100 to convert cents to dollars
          user_id: authResponse.localId,
        },
        isAuthRequest: true,
      });

      navigate("/profile/wallet");
    } catch (error) {
      console.log(error);
      console.log(error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex items-center ">
      <div className="my-8 border w-full max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">
            Add Funds
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4">
          <div className="space-y-4">
            <div>
              <input
                id="cardholder-name"
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full p-3 border border-gray-200 shadow-sm rounded-md focus:outline-none"
                placeholder="Amount (USD)"
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait transition duration-200 ease-in-out flex items-center justify-center"
            >
              Topup
            </button>
          </div>
        </form>
        {errorMessage && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200">
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AddFunds: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  return (
    <>
        <AddFundsForm />
    </>
  );
};

export default AddFunds;
