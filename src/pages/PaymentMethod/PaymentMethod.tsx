import {
  CardCvcElement,
  CardElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

import { loadStripe } from '@stripe/stripe-js';
import React, { useState, FormEvent, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import clsx from 'clsx';

const PaymentMethodForm: React.FC = () => {
  const { authResponse } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>('unknown');
  // State for individual card field errors
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [cardExpiryError, setCardExpiryError] = useState<string | null>(null);
  const [cardCvcError, setCardCvcError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const handleCardChange = (event: any) => {
    setCardBrand(event.brand); // Update the brand based on user input
    setCardNumberError(event.error ? event.error.message : null);
  };

  // Handlers for displaying errors for each field
  const handleCardNumberChange = (event: any) => {
    setCardNumberError(event.error ? event.error.message : null);
  };

  const handleCardExpiryChange = (event: any) => {
    setCardExpiryError(event.error ? event.error.message : null);
  };

  const handleCardCvcChange = (event: any) => {
    setCardCvcError(event.error ? event.error.message : null);
  };

  // Card brand icons
  const cardBrands: Record<string, string> = {
    visa: '/card-brands/visa.svg',
    mastercard: '/card-brands/mastercard.svg',
    amex: '/card-brands/amex.svg',
    discover: '/card-brands/discover.svg',
    unknown: '/card-brands/credit-card.svg',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Check if Stripe and Elements are initialized
    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded correctly.');
      return;
    }

    // Retrieve each element individually
    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    // Verify that all elements are loaded
    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      setErrorMessage('One or more card fields are not loaded.');
      return;
    }

    // Clear previous errors and set loading state
    setErrorMessage(null);
    setSubmitting(true);

    try {
      // Step 1: Create the payment method using all card elements
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: cardholderName, // Add the cardholder's name here
        },
      });

      if (stripeError) {
        setErrorMessage(
          stripeError.message || 'Failed to create the payment method. Please try again.'
        );
        return;
      }

      if (!paymentMethod) {
        setErrorMessage('No payment method was created.');
        return;
      }
      console.log(paymentMethod);

      const paymentMethodId = paymentMethod.id;

      // Step 2: Send payment method ID to the backend

      const response = await apiRequest({
        url: urls.attach_stripe_payment_method,
        method: 'POST',
        body: {
          payment_method_id: paymentMethodId,
          user_id: authResponse.localId,
        },
        isAuthRequest: true,
      });

      navigate('/profile/payment-methods?success=true');
    } catch (error) {
      console.log(error);
      console.log(error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Styling for each Stripe element
  const elementStyles = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '16px',
        '::placeholder': {
          color: '#a0a0a0',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };
  return (
    <div className="h-full flex items-center ">
      <div className="my-8 border w-full max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Add Payment Method</h1>
          <p className="text-gray-500">Enter your card details to add a new payment method.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4">
          <div className="space-y-4">
            <div>
              <input
                id="cardholder-name"
                type="text"
                value={cardholderName}
                onChange={e => setCardholderName(e.target.value)}
                className="w-full p-3 border border-gray-200 shadow-sm rounded-md focus:outline-none"
                placeholder="Name on card"
                required
              />
            </div>
            <div>
              <div className="relative">
                <CardNumberElement
                  options={elementStyles}
                  onChange={handleCardChange}
                  className="w-full p-3 border border-gray-200 shadow-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {cardBrand && (
                  <img
                    src={cardBrands[cardBrand] || '/placeholder.svg?height=24&width=24'}
                    alt={cardBrand}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    width={24}
                    height={24}
                  />
                )}
              </div>
              {cardNumberError && <p className="text-red-500 text-sm mt-1">{cardNumberError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <CardExpiryElement
                  options={elementStyles}
                  onChange={handleCardExpiryChange}
                  className="w-full p-3 border border-gray-200 shadow-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {cardExpiryError && <p className="text-red-500 text-sm mt-1">{cardExpiryError}</p>}
              </div>
              <div>
                <CardCvcElement
                  options={elementStyles}
                  onChange={handleCardCvcChange}
                  className="w-full p-3 border border-gray-200 shadow-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {cardCvcError && <p className="text-red-500 text-sm mt-1">{cardCvcError}</p>}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={!stripe || !elements || submitting}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait transition duration-200 ease-in-out flex items-center justify-center"
            >
              {/* <CreditCard className="inline-block mr-2 h-5 w-5" /> */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="inline-block mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 12C2 8.46252 2 6.69377 3.0528 5.5129C3.22119 5.32403 3.40678 5.14935 3.60746 4.99087C4.86213 4 6.74142 4 10.5 4H13.5C17.2586 4 19.1379 4 20.3925 4.99087C20.5932 5.14935 20.7788 5.32403 20.9472 5.5129C22 6.69377 22 8.46252 22 12C22 15.5375 22 17.3062 20.9472 18.4871C20.7788 18.676 20.5932 18.8506 20.3925 19.0091C19.1379 20 17.2586 20 13.5 20H10.5C6.74142 20 4.86213 20 3.60746 19.0091C3.40678 18.8506 3.22119 18.676 3.0528 18.4871C2 17.3062 2 15.5375 2 12Z"
                  stroke-width="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  opacity="0.4"
                  d="M10 16H11.5"
                  strokeWidth="1.5"
                  stroke-miterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  opacity="0.4"
                  d="M14.5 16L18 16"
                  strokeWidth="1.5"
                  stroke-miterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M2 9H22" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span>Add Payment Method</span>
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

const stripePromise = loadStripe(
  'pk_test_51PligvRtvvmhTtnG3whjRPyT3Aclju9ajcwzp9ZCy6ZbOe037NOEzfvih4GdWnJwBYh5UrqDRIE3Eq41OpNEBskQ00C1G2ZjUe'
);

// const stripePromise = null;

const PaymentMethod: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const snapPoints = ['256', 1];
  const [isMobile, setIsMobile] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <Elements stripe={stripePromise}>
        <PaymentMethodForm />
      </Elements>
    </>
  );
};

export default PaymentMethod;
