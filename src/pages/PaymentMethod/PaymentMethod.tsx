import {
  CardElement,
  Elements,
  PaymentElement,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

const Page = () => {
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Handle payment option change logic here

    if (!elements) {
      return;
    }
    const cardElement = elements.getElement(CardElement);

    console.log(cardElement);
    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      // Show error to your customer
      setErrorMessage(submitError.message);
      return;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-6 rounded-lg shadow-md max-w-xl w-full"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Payment Information
        </h2>
        <PaymentElement onChange={(e) => console.log(e)} />
        <button
          type="submit"
          className="mt-2 w-full bg-primary text-white py-2 rounded-lg hover:bg-primary"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

const stripePromise = loadStripe(
  "pk_test_51PRGpbI72ZehI6L2bqtlYzFRClY03dx4rzKVPJY3NUF4xuToeySpNFYTt9Nt2zFulYJ90ie6i47q0Be49nUUh3lH00EL1eRNk3"
);

const options = {
  mode: "payment",
  amount: 1099,
  currency: "usd",
  // Fully customizable with appearance API.
  appearance: {
    /*...*/
  },
};
const PaymentMethod: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }
  return (
    <Elements stripe={stripePromise} options={options}>
      <Page />
    </Elements>
  );
};

export default PaymentMethod;
