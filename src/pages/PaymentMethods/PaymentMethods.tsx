import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HttpReq } from "../../services/apiService";
import urls from "../../urls.json";

// Mock data for demonstration
const mockCards = Array(20)
  .fill(null)
  .map((_, index) => ({
    id: index + 1,
    type: "VISA",
    number: `****${1000 + index}`,
    name: `Card Holder ${index + 1}`,
    expires: "3/2023",
  }));
export default function PaymentMethods() {
  const { isAuthenticated, authResponse } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [methods, setMethods] = useState(mockCards);
  const currentItems = mockCards.slice(0, 9);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        await HttpReq(
          urls.get_payment_methods,
          setMethods,
          () => {},
          () => {},
          () => {},
          () => {},
          "post",
          { user_id: authResponse?.localId },
          authResponse?.idToken
        );
      } catch (error) {
        console.error("Failed to fetch payment methods", error);
      }
    };
    fetchPaymentMethods();
  }, []);
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }
  return (
    <div className="mx-32 p-6 font-sans">
      <div className="flex items-center mb-6">
        <Link
          to="/profile/payment-methods/add"
          className="flex items-center text-blue-600 mr-4 text-sm font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 mr-2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Add payment method
        </Link>
        <button className="text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-6">Payment methods</h2>

      <div className="mb-8">
        <h3 className="font-semibold mb-2">Default payment method</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your default payment method will be automatically charged each month.
        </p>
        <div className="flex flex-col justify-between border rounded-lg p-4 max-w-sm">
          <div className="flex items-start">
            <div className="bg-blue-600 text-white font-bold rounded px-2 py-1 text-xs mr-3">
              VISA
            </div>
            <div>
              <p className="font-semibold">Visa ****2142</p>
              <p className="text-sm text-gray-600">Expires on 3/2023</p>

              <div>
                <button className="text-blue-600 text-sm font-medium mr-4">
                  Replace
                </button>
                <button className="text-blue-600 text-sm font-medium">
                  Detach
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Your credit and debit cards</h3>
      <p className="text-sm text-gray-600 mb-4">
        Here's a list of your personal credit and debit cards. Select the
        ellipsis (...) to edit or delete a card or make it the default payment
        method of this billing profile.
      </p>

      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-600 border-b">
            <th className="pb-2">No.</th>
            <th className="pb-2">Name on card</th>
            <th className="pb-2">Expires on</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((card) => (
            <tr key={card.id} className="border-b text-sm">
              <td className="py-2 flex items-center">
                <div className="bg-blue-600 text-white font-semibold rounded px-1 py-0.5 text-xs mr-2">
                  {card.type}
                </div>
                <span>
                  {card.type} {card.number}
                </span>
              </td>
              <td className="py-2">{card.name}</td>
              <td className="py-2">{card.expires}</td>
              <td className="py-2 text-right relative">
                <button
                  onClick={() =>
                    setDropdownOpen(dropdownOpen === card.id ? null : card.id)
                  }
                  className="focus:outline-none"
                >
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
                      strokeWidth="2.5"
                      strokeLinecap="square"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17.9998 12H18.0088"
                      stroke="#141B34"
                      strokeWidth="2.5"
                      strokeLinecap="square"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.99981 12H6.00879"
                      stroke="#141B34"
                      strokeWidth="2.5"
                      strokeLinecap="square"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {dropdownOpen === card.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md border shadow-lg z-10">
                    <div className="py-1">
                      <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
