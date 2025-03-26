import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import urls from '../../urls.json';
import apiRequest from '../../services/apiRequest';

export default function Wallet() {
  const { authResponse } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0.0);

  // Check for success query parameter
  const getWallet = async () => {
    const res = await apiRequest({
      url: urls.fetch_wallet + `?user_id=${authResponse.localId}`,
      method: 'get',
      isAuthRequest: true,
    });
    setBalance(res.data.data.balance.toFixed(2));
  };
  useEffect(() => {
    getWallet();
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [authResponse]);

  if (isLoading)
    return (
      <div className="text-lg text-primary text-center mt-14 font-semibold">
        <h1>Loading Wallet details...</h1>
      </div>
    );

  return (
    <div className="2xl:mx-32 p-6 font-sans">
      <h2 className="text-xl font-semibold mb-6">Credits</h2>
      <div className="rounded-md shadow-sm border p-4">
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm font-bold text-gray-600">Total amount remaining</p>
            <p className="text-sm text-gray-600">${balance}</p>
          </div>
          <div className="w-px h-10 bg-gray-300"></div>
          <Link
            to="/profile/wallet/add"
            className="flex items-center text-blue-600 mr-4 text-sm font-medium"
          >
            <button className="h-10 px-6 py-2 bg-[#115740] text-white font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer m-2">
              Add Funds
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
