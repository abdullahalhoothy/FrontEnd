import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import urls from "../../urls.json";
import apiRequest from "../../services/apiRequest";
import { PiX } from "react-icons/pi";

interface PaymentMethod {
  id: number;
  type: string;
  lastFour: string;
  expiry: string;
  isDefault?: boolean;
}

const paymentBrandIcons = {
  visa: "/card-brands/visa.svg",
  mastercard: "/card-brands/mastercard.svg",
  amex: "/card-brands/amex.svg",
  discover: "/card-brands/discover.svg",
  unknown: "/card-brands/credit-card.svg",
};

export default function PaymentMethods() {
  const { isAuthenticated, authResponse } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<
    string | null
  >(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<string | null>(null);

  // Check for success query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("success") === "true") {
      setShowSuccessMessage(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const customer = await fetchDefaultPaymentMethodId();
        const defaultId = customer?.invoice_settings?.default_payment_method;
        if (customer) {
          setDefaultPaymentMethodId(defaultId || null);
          await fetchPaymentMethods(defaultId || "");
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [authResponse]);

  const fetchDefaultPaymentMethodId = async (): Promise<string | null> => {
    try {
      const res = await apiRequest({
        url: urls.get_stripe_customer,
        method: "post",
        isAuthRequest: true,
        body: { user_id: authResponse?.localId },
      });
      return res.data.data || null;
    } catch (error) {
      console.error(
        "Failed to fetch Stripe customer default payment method ID",
        error
      );
      return null;
    }
  };

  const fetchPaymentMethods = async (defaultId: string) => {
    try {
      const res = await apiRequest({
        url: `${urls.list_stripe_payment_methods}?user_id=${authResponse?.localId}`,
        method: "get",
        isAuthRequest: true,
      });
      setPaymentMethods(res.data.data);
      setDefaultPaymentMethodId(defaultId);
    } catch (error) {
      console.error("Failed to fetch payment methods", error);
    }
  };

  const handleRemove = async () => {
    if (!methodToRemove) return;
    setSubmitting(true);
    try {
      await apiRequest({
        url: `${urls.detach_stripe_payment_method}?payment_method_id=${methodToRemove}`,
        method: "delete",
        isAuthRequest: true,
      });
      setPaymentMethods((methods) =>
        methods.filter((method) => method.id !== methodToRemove)
      );
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to remove payment method", error);
    } finally {
      setSubmitting(false);
      setMethodToRemove(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSubmitting(true);
    try {
      await apiRequest({
        url: `${urls.set_default_stripe_payment_method}?user_id=${authResponse?.localId}&payment_method_id=${id}`,
        method: "put",
        isAuthRequest: true,
      });
      setDefaultPaymentMethodId(id);
    } catch (error) {
      console.error("Failed to set default payment method", error);
    } finally {
      setSubmitting(false);
    }
  };

  const defaultPaymentMethod = paymentMethods.find(
    (method) => method.id === defaultPaymentMethodId
  );

  if (isLoading)
    return (
      <div className="text-lg text-primary text-center mt-14 font-semibold">
        <h1>Loading Payment Methods...</h1>
      </div>
    );

  return (
    <div className="2xl:mx-32 p-6 font-sans">
      <div className="flex items-center mb-6">
        <Link
          to="/profile/payment-methods/add"
          className="flex items-center text-blue-600 mr-4 text-sm font-medium"
        >
          <svg
            className="w-4 h-4 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Add payment method
        </Link>
      </div>
      {/* Success message */}
      {showSuccessMessage && (
        <div className="flex items-center justify-between mb-4 p-2 text-green-800 bg-green-100 border border-green-200 rounded relative">
          <p>Payment method added successfully!</p>
          <button
            onClick={() => {
              setShowSuccessMessage(false);
              navigate(location.pathname, { replace: true }); // Remove query parameter
            }}
            className="text-2xl text-green-800 hover:text-green-600 focus:outline-none"
          >
            <PiX className="w-4 h-4" />
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-6">Payment methods</h2>

      {/* Default Payment Method Component */}
      <DefaultPaymentMethod
        paymentMethod={defaultPaymentMethod}
        onRemove={() => {
          setMethodToRemove(defaultPaymentMethodId);
          setDialogOpen(true);
        }}
      />

      <h3 className="font-semibold mb-2">Your credit and debit cards</h3>
      <p className="text-sm text-gray-600 mb-4">
        Here's a list of your personal credit and debit cards. Select the
        ellipsis (...) to delete a card or make it the default payment method.
      </p>
      <div className="rounded-md shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600 border-b">
              <th className="p-2">No.</th>
              <th className="p-2">Name on Card</th>
              <th className="p-2">Expires on</th>
              <th className="p-2 text-right ">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map((method, index) => (
              <tr key={method.id} className="border-b last:border-none text-sm">
                <td className="p-2 flex items-center gap-2">
                  <img
                    src={
                      paymentBrandIcons[method.card.brand] ||
                      paymentBrandIcons.unknown
                    }
                    alt={`${method.card.brand} logo`}
                    className="w-8 h-8"
                  />
                  {method.card.brand.toUpperCase()} ****{method.card.last4}
                </td>
                <td className="p-2">
                  {method.billing_details.name || "Unknown"}
                </td>
                <td className="p-2">
                  {method.card.exp_month}/{method.card.exp_year}
                </td>
                <td className="p-2 text-right relative">
                  <ActionDropdown
                    isOpen={dropdownOpen === method.id}
                    setDropdownOpen={() =>
                      setDropdownOpen(
                        dropdownOpen === method.id ? null : method.id
                      )
                    }
                    onRemove={() => {
                      setMethodToRemove(method.id);
                      setDialogOpen(true);
                    }}
                    onSetDefault={() => handleSetDefault(method.id)}
                    submitting={submitting}
                    defaultPaymentMethodId={defaultPaymentMethodId}
                    paymentMethodId={method.id}
                  />
                </td>
              </tr>
            ))}
            {paymentMethods.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="h-36 text-center text-sm font-semibold py-4"
                >
                  No payment methods available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        isOpen={dialogOpen}
        title="Confirm Remove Payment Method"
        message="Are you sure you want to remove this payment method? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        submitting={submitting}
        onConfirm={handleRemove}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}

function DefaultPaymentMethod({
  paymentMethod,
  onRemove,
}: {
  paymentMethod?: PaymentMethod;
  onRemove: () => void;
}) {
  const renderPaymentBrandIcon = (type: string) => (
    <img
      src={paymentBrandIcons[type] || paymentBrandIcons.unknown}
      alt={`${type} logo`}
      className="w-8 h-8"
    />
  );

  return paymentMethod ? (
    <div className="flex flex-col justify-between border rounded shadow-sm p-4 max-w-sm mb-4">
      <div className="flex items-start">
        <div className="mr-3 ">
          {renderPaymentBrandIcon(paymentMethod.card.brand)}
        </div>
        <div className="uppercase">
          <p className="font-semibold">
            {paymentMethod.card.brand} ****{paymentMethod.card.last4}
          </p>
          <p className="text-sm text-gray-600">
            Expires on {paymentMethod.card.exp_month}/
            {paymentMethod.card.exp_year}
          </p>
          <button
            className="text-blue-600 text-sm font-medium"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col justify-between border rounded shadow-sm p-4 max-w-sm mb-4">
      <p className="text-sm text-gray-500">No default payment method set.</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={14}
      height={14}
      className={`animate-spin duration-700 `}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

function ActionDropdown({
  isOpen,
  setDropdownOpen,
  onRemove,
  onSetDefault,
  defaultPaymentMethodId,
  paymentMethodId,
  submitting,
}: {
  isOpen: boolean;
  setDropdownOpen: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
  submitting: boolean;
}) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Skip if clicking on a button or interactive element
      if (target.tagName === "BUTTON" || target.closest("button")) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mouseup", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [isOpen, setDropdownOpen]);
  const isDefault = defaultPaymentMethodId === paymentMethodId;

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={setDropdownOpen} className="focus:outline-none">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.9959 12H12.0049"
            stroke="#141B34"
            stroke-width="2.5"
            stroke-linecap="square"
            stroke-linejoin="round"
          ></path>
          <path
            d="M17.9998 12H18.0088"
            stroke="#141B34"
            stroke-width="2.5"
            stroke-linecap="square"
            stroke-linejoin="round"
          ></path>
          <path
            d="M5.99981 12H6.00879"
            stroke="#141B34"
            stroke-width="2.5"
            stroke-linecap="square"
            stroke-linejoin="round"
          ></path>
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-sm z-10 transition-all duration-300 transform ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ display: isOpen ? "block" : "none" }}
        >
          {!isDefault && (
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onSetDefault}
              disabled={submitting}
            >
              {submitting && <Spinner />}
              Set as Default
            </button>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  submitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function Dialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  submitting = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="text-left fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-md shadow-lg max-w-lg w-full p-4 mx-4">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="h-9 flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="h-9 flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 
            disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
          >
            {submitting && <Spinner />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
